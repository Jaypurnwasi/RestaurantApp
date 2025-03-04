import { GraphQLError } from "graphql";
import MenuItem,{IMenuItem} from "../../models/MenuItem";
import Cart from "../../models/Cart";
import Order from "../../models/Order";
import Transaction from "../../models/Transaction";
import logger from "../../utils/logger";
import { MyContext,CreateOrderInput, OrderStatus,UpdateOrderStatusInput} from "../types/types";
import Table from "../../models/Table";
import { PubSub } from "graphql-subscriptions";
import { timeStamp } from "console";
 
const pubsub = new PubSub();


export const orderResolvers = {

Query : {
  getOrderById: async (_: any, { orderId }: { orderId: string }, context: MyContext) => {
    try {
      // Ensure user is authenticated
      if (!context.user) {
        throw new GraphQLError("Authentication error: User not authenticated", {
          extensions: { code: "UNAUTHORIZED" },
        });
      }

      //  Fetch order and populate items
      const order = await Order.findById(orderId)
        .populate({
          path: "items.menuItem",
          model: MenuItem, // Populates MenuItem details
        })
        .lean();

      // Check if order exists
      if (!order) {
        throw new GraphQLError("Order not found", { extensions: { code: "NOT_FOUND" } });
      }

      //  Ensure user has permission (Admin, KitchenStaff, Waiter, or Order Owner)
      const allowedRoles = ["Admin", "KitchenStaff", "Waiter"];
      if (context.user.role !== "Customer" && !allowedRoles.includes(context.user.role)) {
        throw new GraphQLError("Forbidden: You do not have permission to view this order", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      //  Customers can only view their own orders
      if (context.user.role === "Customer" && order.customerId._id.toString() !== context.user.id) {
        throw new GraphQLError("Forbidden: You can only view your own orders", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      // Fetch associated transaction (if exists)
      const transaction = await Transaction.findOne({ orderId: order._id }).lean();

      // return order;

      return {
        id: order._id,
        tableId: order.tableId,
        items: order.items.map((item) => {
          const menuItem = item.menuItem as unknown as IMenuItem; // Explicitly cast to MenuItemDocument
          return {
            menuItem: {
              id: menuItem._id,
              name: menuItem.name,
              description: menuItem.description,
              image: menuItem.image,
              price: menuItem.price,
              isVeg: menuItem.isVeg,
              categoryId: menuItem.categoryId,
              isActive: menuItem.isActive,
            },
            quantity: item.quantity,
          };
        }),
        amount: order.amount,
        status: order.status,
        customerId: order.customerId._id,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        
      };
    } catch (error: any) {
      logger.error("Error fetching order by ID:", error);
      throw new GraphQLError(error.message, { extensions: { code: "INTERNAL_SERVER_ERROR" } });
    }
  },
  getAllOrders: async (_: any, __: any, context: MyContext) => {
    try {
      // Ensure user is authenticated
      if (!context.user) {
        throw new GraphQLError("Authentication error: User not authenticated", {
          extensions: { code: "UNAUTHORIZED" },
        });
      }
  
      const { role, id: userId } = context.user;

      let filter = {}; // Default: No filter (Admin gets all orders)
  
      // Customers can only fetch their own orders
      if (!["Admin","Waiter","KitchenStaff"].includes(role)) {
        filter = { customerId: userId };
      }
  
      //  Fetch all orders and populate items and customers
      const orders = await Order.find(filter)
        .populate({
          path: "items.menuItem",
          model: MenuItem, // Ensures full MenuItem details are included
        })
        .populate("customerId")
        .sort({ createdAt: -1 })
        .lean();
  
      if (orders.length === 0) {
        throw new GraphQLError("No orders found", { extensions: { code: "NOT_FOUND" } });
      }
   
      return orders.map(order => ({
        id: order._id.toString(),
        tableId: order.tableId.toString(),
        items: order.items.map(item => {
          const menuItem = item.menuItem as unknown as IMenuItem;
          return {
            menuItem: {
              id: menuItem._id,
              name: menuItem.name,
              description: menuItem.description,
              image: menuItem.image,
              price: menuItem.price,
              isVeg: menuItem.isVeg,
              categoryId: menuItem.categoryId,
              isActive: menuItem.isActive,
            },
            quantity: item.quantity,
          };
        }),
        amount: order.amount,
        status: order.status,
        customerId: order.customerId ? order.customerId._id : null,
        createdAt: order.createdAt.toLocaleString(),
        updatedAt: order.updatedAt.toLocaleString(),
        
      }));
    } catch (error: any) {
      logger.error("Error fetching all orders:", error);
      throw new GraphQLError(error.message, { extensions: { code: "INTERNAL_SERVER_ERROR" } });
    }
  }

},

Mutation:{
    createOrder: async (_: any, { input }: { input: CreateOrderInput }, context: MyContext) => {
        try {
          
          // Ensure user is authenticated
          if(!context.user){
            throw new GraphQLError("Authentication error user not authenticated", { extensions: { code: "token not found" } });

          }
          // Extract input
          const { tableId, amount, success } = input;
          const customerId = context.user.id;
  
          
          
          // Fetch cart items
          const cart = await Cart.findOne({ userId: customerId }).populate("items.menuItemId");
          if (!cart || cart.items.length === 0) {
            throw new GraphQLError("Cart is empty", { extensions: { code: "BAD_REQUEST" } });
          }
          // console.log(cart)

          //  Validate stock availability
        for (const item of cart.items) {
          const menuItem = await MenuItem.findById(item.menuItemId);
          if (!menuItem) {
            throw new GraphQLError(`Menu item not found: ${item.menuItemId}`, { extensions: { code: "BAD_REQUEST" } });
          }
          if (menuItem.isActive === false) {
            throw new GraphQLError(`Menu item is not available: ${menuItem.name}`, {
              extensions: { code: "BAD_REQUEST" },
            });
          }
        }

        const existingTable = await Table.findById(tableId);
          if(!existingTable){
            throw new GraphQLError("table does not exists", { extensions: { code: "BAD_REQUEST" } });

          }

          
  
          // Convert cart items to order items
          const orderItems = cart.items.map((item) => ({
            menuItem: item.menuItemId._id,
            quantity: item.quantity,
          }));
  
          // Create Order  Status
          const orderStatus = success ? "Pending" : "Failed";
  
          // Create new Order
          const newOrder = await Order.create({
            tableId,
            items: orderItems,
            amount,
            status: orderStatus,
            customerId,
          });
  
          logger.info(`Order created: ${newOrder._id} by user ${customerId}`);
  
          // Create a Transaction record
          const newTransaction = await Transaction.create({
            mode: "Upi", // Default mode (can be modified later)
            amount,
            success,
            orderId: newOrder._id,
          });
  
          logger.info(`Transaction created: ${newTransaction._id} by user ${customerId}`);
  
          // Clear the user's cart after order creation
          await Cart.findOneAndDelete({ userId: customerId });
  
          // Return newly created order
          
          return {
            id: newOrder._id,
            tableId: newOrder.tableId,
            items: await Promise.all(
              newOrder.items.map(async (item) => ({
                menuItem: await MenuItem.findById(item.menuItem),
                quantity: item.quantity,
              }))
            ),
            amount: newOrder.amount,
            status: newOrder.status,
            customerId: newOrder.customerId,
            createdAt: newOrder.createdAt.toISOString(),
            updatedAt: newOrder.updatedAt.toISOString(),
          };
        } catch (error: any) {
          logger.error("Error creating order:", error);
          throw new GraphQLError(error.message, { extensions: { code: "INTERNAL_SERVER_ERROR" } });
        }
      },
      updateOrderStatus: async (  _: any, { input }: { input: UpdateOrderStatusInput },context: MyContext ) => {
        try {
          // Ensure user is authenticated
          if (!context.user) {
            throw new GraphQLError("Authentication error: User not authenticated", {
              extensions: { code: "UNAUTHORIZED" },
            });
          }
  
          //  Only Admin, KitchenStaff, or Waiter can update order status
          const allowedRoles = ["Admin", "KitchenStaff", "Waiter"];
          if (!allowedRoles.includes(context.user.role)) {
            throw new GraphQLError("Forbidden: You do not have permission to update order status", {
              extensions: { code: "FORBIDDEN" },
            });
          }
  
          // Extract input
          const { orderId, status } = input;
  
          //  Check if the order exists
          const order = await Order.findById(orderId)
          if (!order) {
            throw new GraphQLError("Order not found", { extensions: { code: "NOT_FOUND" } });
          }
  
          // Prevent invalid status transitions
          const validStatusTransitions: Record<string, string[]> = {
            Pending: ["Prepared", "Failed","Pending"],
            Prepared: ["Completed","Failed","Prepared"],
            Completed: [], // No further status change allowed
            Failed: [], // No further status change allowed
          };
  
          if (!validStatusTransitions[order.status].includes(status)) {
            throw new GraphQLError(
              `Invalid status transition: Cannot change order from ${order.status} to ${status}`,
              { extensions: { code: "BAD_REQUEST" } }
            );
          }
  
          // Update order status
          order.status = status;
          await order.save();
  
  
          // Log the status update
          logger.info(`Order ${orderId} status updated to ${status} by ${context.user.role}`);

          pubsub.publish("ORDER_UPDATED", { orderUpdated:{
            orderId: order._id,
            updatedStatus: order.status,
            success:true
            
          }  });

  
          //  Return updated order
          return {
            orderId: order._id,
            updatedStatus: order.status,
            success:true
            
          };
        } catch (error: any) {
          logger.error("Error updating order status:", error);
          throw new GraphQLError(error.message, { extensions: { code: "INTERNAL_SERVER_ERROR" } });
        }
      },
      


},

Subscription: {
  orderUpdated: {
    subscribe: () => pubsub.asyncIterableIterator("ORDER_UPDATED"),
  }
},


}