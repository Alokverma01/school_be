import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateOrderDto } from './school-shop.dto';

@Injectable()
export class ShopService {
  constructor(readonly dataSource: DataSource) { }

  // ---------------- PRODUCTS ----------------

  // async createProduct(body: any) {
  //   await this.dataSource.query(
  //     `INSERT INTO products (name, category, price, stock)
  //      VALUES ($1, $2, $3, $4)`,
  //     [body.name, body.category, body.price, body.stock],
  //   );

  //   return { status: true, message: 'Product created successfully' };
  // }

  // async getProducts(page?: number, limit?: number) {
  //   let query = `
  //     SELECT 
  //     product_id,
  //     name,
  //     category, 
  //     price,
  //     stock
  //     FROM products 
  //     WHERE status = 1
  //     ORDER BY product_id ASC
  //   `;

  //   const params: any[] = [];

  //   if (page && limit) {
  //     query += ` LIMIT $1 OFFSET $2`;
  //     params.push(limit, (page - 1) * limit);
  //   }

  //   const data = await this.dataSource.query(query, params);

  //   // total count only needed when paginated
  //   let totalRecords = data.length;
  //   let totalPages = 1;

  //   if (page && limit) {
  //     const count = await this.dataSource.query(
  //       `SELECT COUNT(*) FROM products WHERE status = 1`,
  //     );
  //     totalRecords = parseInt(count[0].count);
  //     totalPages = Math.ceil(totalRecords / limit);
  //   }

  //   return {
  //     status: true,
  //     message: 'Products fetched successfully',
  //     data,
  //     totalRecords: totalRecords,
  //     totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
  //   };
  // }

  // async getProductById(product_id: number) {
  //   if (!product_id) {
  //     throw new BadRequestException('product_id is required');
  //   }

  //   const product = await this.dataSource.query(
  //     `
  //   SELECT 
  //     product_id,
  //     name,
  //     category, 
  //     price,
  //     stock
  //   FROM products 
  //   WHERE product_id = $1 
  //     AND status = 1
  //   `,
  //     [product_id],
  //   );

  //   if (product.length === 0) {
  //     throw new NotFoundException('Product not found');
  //   }

  //   return {
  //     status: true,
  //     message: 'Product by id fetched successfully',
  //     data: product[0],
  //   };
  // }

  // async updateProduct(product_id: number, body: any) {
  //   if (!product_id) {
  //     throw new BadRequestException('product_id is required');
  //   }

  //   const exists = await this.dataSource.query(
  //     `
  //   SELECT product_id 
  //   FROM products 
  //   WHERE product_id = $1 
  //     AND status = 1
  //   `,
  //     [product_id],
  //   );

  //   if (exists.length === 0) {
  //     throw new NotFoundException('Product not found');
  //   }

  //   await this.dataSource.query(
  //     `
  //   UPDATE products
  //   SET
  //     name = $1,
  //     category = $2,
  //     price = $3,
  //     stock = $4,
  //     updated_at = NOW()
  //   WHERE product_id = $5
  //   `,
  //     [body.name, body.category, body.price, body.stock, product_id],
  //   );

  //   return {
  //     status: true,
  //     message: 'Product updated successfully',
  //   };
  // }

  // async deleteProduct(product_id: number) {
  //   if (!product_id) {
  //     throw new BadRequestException('product_id is required');
  //   }

  //   const exists = await this.dataSource.query(
  //     `
  //   SELECT product_id 
  //   FROM products 
  //   WHERE product_id = $1 
  //     AND status = 1
  //   `,
  //     [product_id],
  //   );

  //   if (exists.length === 0) {
  //     throw new NotFoundException('Product not found');
  //   }

  //   await this.dataSource.query(
  //     `UPDATE products SET status = 0 WHERE product_id = $1`,
  //     [product_id],
  //   );

  //   return {
  //     status: true,
  //     message: 'Product deleted successfully',
  //   };
  // }

  // async searchProducts(keyword: string, page?: number, limit?: number) {
  //   let query = `
  //   SELECT * FROM products
  //   WHERE status = 1 AND (name ILIKE $1 OR category ILIKE $1)
  //   ORDER BY product_id DESC
  // `;

  //   const params: any[] = [`%${keyword}%`];

  //   if (page && limit) {
  //     query += ` LIMIT $2 OFFSET $3`;
  //     params.push(limit, (page - 1) * limit);
  //   }

  //   const data = await this.dataSource.query(query, params);
  //   return { status: true, data };
  // }

  // ---------------- ORDERS ----------------

  async createOrder(body: CreateOrderDto) {
    const client = this.dataSource.createQueryRunner();
    await client.connect();
    await client.startTransaction();

    try {
      // Validate student exists
      const student = await client.query(
        `SELECT student_id FROM students WHERE student_id = $1 AND status = 1`,
        [body.student_id]
      );

      if (student.length === 0) {
        throw new BadRequestException('Student not found');
      }

      // Validate branch exists
      const branch = await client.query(
        `SELECT branch_id FROM branches WHERE branch_id = $1 AND status = 1`,
        [body.branch_id]
      );

      if (branch.length === 0) {
        throw new BadRequestException('Branch not found');
      }

      let totalAmount = 0;
      const inventoryMap = new Map<number, any>();

      // Validate each item from inventory and calculate total
      for (const item of body.items) {
        const inventoryResult = await client.query(
          `
        SELECT item_id, item_name, quantity, unit_cost 
        FROM inventory 
        WHERE item_id = $1 AND branch_id = $2 AND status = 1
        `,
          [item.product_id, body.branch_id]
        );

        if (inventoryResult.length === 0) {
          throw new BadRequestException(
            `Item not found in this branch`
          );
        }

        const invItem = inventoryResult[0];

        if (invItem.quantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${invItem.item_name}". Available: ${invItem.quantity}, Requested: ${item.quantity}`
          );
        }

        inventoryMap.set(item.product_id, invItem);
        totalAmount += invItem.unit_cost * item.quantity;
      }

      // Create the main order
      const orderResult = await client.query(
        `
      INSERT INTO orders 
      (branch_id, class_id, section_id, student_id, total_amount, status)
      VALUES ($1, $2, $3, $4, $5, 1)
      RETURNING order_id
      `,
        [
          body.branch_id,
          body.class_id,
          body.section_id,
          body.student_id,
          totalAmount,
        ]
      );

      const orderId = orderResult[0].order_id;

      // Insert order items and deduct from inventory
      for (const item of body.items) {
        const invItem = inventoryMap.get(item.product_id);
        const itemTotal = invItem.unit_cost * item.quantity;

        // Insert into order_items
        await client.query(
          `
        INSERT INTO order_items 
        (order_id, product_id, quantity, status)
        VALUES ($1, $2, $3, 1)
        `,
          [orderId, item.product_id, item.quantity]
        );

        // Deduct quantity from inventory
        await client.query(
          `
        UPDATE inventory
        SET quantity = quantity - $1
        WHERE item_id = $2 AND branch_id = $3
        `,
          [item.quantity, item.product_id, body.branch_id]
        );
      }

      await client.commitTransaction();

      return {
        status: true,
        message: 'Order placed successfully',
        order_id: orderId,
        total_amount: totalAmount.toFixed(2),
      };
    } catch (err) {
      await client.rollbackTransaction();
      throw err;
    } finally {
      await client.release();
    }
  }

  async getOrders(student_id?: number, page?: number, limit?: number) {
    let query = `
    SELECT 
      o.order_id,
      o.branch_id,
      b.branch_name,
      o.class_id,
      c.class_name,
      o.section_id,
      sec.section_name,
      o.student_id,
      CONCAT(s.first_name, ' ', s.last_name) AS student_name,
      o.total_amount AS total_price,
      o.created_at AS order_date
    FROM orders o
    LEFT JOIN students s ON s.student_id = o.student_id
    LEFT JOIN branches b ON b.branch_id = o.branch_id
    LEFT JOIN classes c ON c.class_id = o.class_id
    LEFT JOIN sections sec ON sec.section_id = o.section_id
    WHERE o.status = 1
  `;

    const params: any[] = [];
    let index = 1;

    if (student_id) {
      query += ` AND o.student_id = $${index}`;
      params.push(student_id);
      index++;
    }

    query += ` ORDER BY o.order_id DESC`;

    // Pagination
    if (page && limit) {
      query += ` LIMIT $${index} OFFSET $${index + 1}`;
      params.push(limit, (page - 1) * limit);
    }

    const data = await this.dataSource.query(query, params);

    // If no pagination
    if (!page || !limit) {
      return {
        status: true,
        message: 'All orders fetched successfully',
        data,
        totalRecords: data.length,
      };
    }

    // Count query
    let countQuery = `SELECT COUNT(*) FROM orders WHERE status = 1`;
    const countParams: any[] = [];

    if (student_id) {
      countQuery += ` AND student_id = $1`;
      countParams.push(student_id);
    }

    const countResult = await this.dataSource.query(countQuery, countParams);
    const totalRecords = parseInt(countResult[0].count);
    const totalPages = Math.ceil(totalRecords / limit);

    return {
      status: true,
      message: 'Orders fetched successfully',
      data,
      totalRecords,
      totalPages,
      currentPage: page,
    };
  }

  async getOrderDetails(order_id: number) {
    if (!order_id) {
      throw new BadRequestException('order_id is required');
    }

    // Fetch main order details
    const orderResult = await this.dataSource.query(
      `
    SELECT 
      o.order_id,
      o.branch_id,
      o.class_id,
      o.section_id,
      o.student_id,
      CONCAT(s.first_name, ' ', s.last_name) AS student_name,
      o.total_amount AS total_price,
      o.created_at AS order_date
    FROM orders o
    LEFT JOIN students s ON s.student_id = o.student_id
    WHERE o.order_id = $1 AND o.status = 1
    `,
      [order_id]
    );

    if (orderResult.length === 0) {
      throw new NotFoundException('Order not found');
    }

    const order = orderResult[0];

    // Fetch order items with inventory details
    const items = await this.dataSource.query(
      `
    SELECT 
      oi.order_item_id,
      oi.product_id AS item_id,
      i.item_name,
      i.unit_cost AS price,
      oi.quantity,
      (oi.quantity * i.unit_cost) AS total_price
    FROM order_items oi
    JOIN inventory i ON i.item_id = oi.product_id
    WHERE oi.order_id = $1 AND oi.status = 1
    ORDER BY oi.order_item_id
    `,
      [order_id]
    );

    return {
      status: true,
      message: 'Order details fetched successfully',
      order,
      items,
    };
  }

  async updateOrder(order_id: number, body: CreateOrderDto) {
    const client = this.dataSource.createQueryRunner();
    await client.connect();
    await client.startTransaction();

    try {
      // Validate order exists and get current items
      const orderCheck = await client.query(
        `SELECT order_id, student_id FROM orders WHERE order_id = $1 AND status = 1`,
        [order_id]
      );

      if (orderCheck.length === 0) {
        throw new NotFoundException('Order not found');
      }

      // Validate student matches (security)
      if (orderCheck[0].student_id !== body.student_id) {
        throw new BadRequestException('Student ID cannot be changed');
      }

      // Fetch current order items
      const currentItems = await client.query(
        `SELECT order_item_id, product_id, quantity FROM order_items WHERE order_id = $1 AND status = 1`,
        [order_id]
      );

      const currentMap = new Map<number, { order_item_id: number, quantity: number }>();
      currentItems.forEach((item: any) => {
        currentMap.set(item.product_id, { order_item_id: item.order_item_id, quantity: item.quantity });
      });

      let totalAmount = 0;
      const inventoryMap = new Map<number, any>();

      // Process each new item for validation and total calculation
      for (const item of body.items) {
        const inventoryResult = await client.query(
          `
          SELECT item_id, item_name, quantity AS stock, unit_cost 
          FROM inventory 
          WHERE item_id = $1 AND branch_id = $2 AND status = 1
          `,
          [item.product_id, body.branch_id]
        );

        if (inventoryResult.length === 0) {
          throw new BadRequestException(`Item ID ${item.product_id} not found in branch`);
        }

        const invItem = inventoryResult[0];
        inventoryMap.set(item.product_id, invItem);

        const currentData = currentMap.get(item.product_id);
        const currentQty = currentData ? currentData.quantity : 0;
        const qtyDiff = item.quantity - currentQty;

        if (qtyDiff > 0) {
          // Quantity increased → check stock
          if (invItem.stock < qtyDiff) {
            throw new BadRequestException(
              `Insufficient stock for "${invItem.item_name}". Need ${qtyDiff} more, only ${invItem.stock} available`
            );
          }
        }

        totalAmount += invItem.unit_cost * item.quantity;
      }

      // Update main order
      await client.query(
        `
        UPDATE orders 
        SET branch_id = $1, class_id = $2, section_id = $3, 
            student_id = $4, total_amount = $5, updated_at = NOW()
        WHERE order_id = $6
        `,
        [
          body.branch_id,
          body.class_id,
          body.section_id,
          body.student_id,
          totalAmount,
          order_id,
        ]
      );

      const itemsInRequest = new Set<number>();

      // Update or Insert items
      for (const item of body.items) {
        itemsInRequest.add(item.product_id);
        const existingItem = currentMap.get(item.product_id);

        if (existingItem) {
          // Update existing item if quantity changed
          if (existingItem.quantity !== item.quantity) {
            await client.query(
              `UPDATE order_items SET quantity = $1, updated_at = NOW() WHERE order_item_id = $2`,
              [item.quantity, existingItem.order_item_id]
            );

            // Adjust inventory stock
            const qtyDiff = item.quantity - existingItem.quantity;
            await client.query(
              `UPDATE inventory SET quantity = quantity - $1 WHERE item_id = $2 AND branch_id = $3`,
              [qtyDiff, item.product_id, body.branch_id]
            );
          }
        } else {
          // Insert new item
          await client.query(
            `INSERT INTO order_items (order_id, product_id, quantity, status) VALUES ($1, $2, $3, 1)`,
            [order_id, item.product_id, item.quantity]
          );

          // Adjust inventory stock
          await client.query(
            `UPDATE inventory SET quantity = quantity - $1 WHERE item_id = $2 AND branch_id = $3`,
            [item.quantity, item.product_id, body.branch_id]
          );
        }
      }

      // Soft delete items not in request
      for (const [productId, existingItem] of currentMap.entries()) {
        if (!itemsInRequest.has(productId)) {
          await client.query(
            `UPDATE order_items SET status = 0, updated_at = NOW() WHERE order_item_id = $1`,
            [existingItem.order_item_id]
          );

          // Restore inventory stock
          await client.query(
            `UPDATE inventory SET quantity = quantity + $1 WHERE item_id = $2 AND branch_id = $3`,
            [existingItem.quantity, productId, body.branch_id]
          );
        }
      }

      await client.commitTransaction();
      return {
        status: true,
        message: 'Order updated successfully',
        order_id,
        total_amount: totalAmount.toFixed(2),
      };
    } catch (err) {
      await client.rollbackTransaction();
      throw err;
    } finally {
      await client.release();
    }
  }


  async searchOrders(keyword: string, page?: number, limit?: number) {
    if (!keyword?.trim()) {
      throw new BadRequestException('Search keyword is required');
    }

    const search = `%${keyword.trim()}%`;
    const params: any[] = [search];
    let idx = 2;

    let pagination = '';
    if (page && limit) {
      pagination = ` LIMIT $${idx++} OFFSET $${idx++}`;
      params.push(limit, (page - 1) * limit);
    }

    const query = `
    SELECT 
      o.order_id,
      o.branch_id,
      b.branch_name,
      o.class_id,
      c.class_name,
      o.section_id,
      sec.section_name,
      o.student_id,
      CONCAT(s.first_name, ' ', s.last_name) AS student_name,
      o.total_amount AS total_price,
      o.created_at AS order_date
    FROM orders o
    LEFT JOIN students s ON s.student_id = o.student_id
    LEFT JOIN branches b ON b.branch_id = o.branch_id
    LEFT JOIN classes c ON c.class_id = o.class_id
    LEFT JOIN sections sec ON sec.section_id = o.section_id
    WHERE o.status = 1
      AND (
        CONCAT(s.first_name, ' ', s.last_name) ILIKE $1
        OR b.branch_name ILIKE $1
        OR c.class_name ILIKE $1
        OR sec.section_name ILIKE $1
        OR TO_CHAR(o.created_at, 'YYYY-MM-DD') ILIKE $1
      )
    ORDER BY o.order_id DESC
    ${pagination}
  `;

    const data = await this.dataSource.query(query, params);

    // Count query
    const countQuery = `
    SELECT COUNT(*)
    FROM orders o
    LEFT JOIN students s ON s.student_id = o.student_id
    LEFT JOIN branches b ON b.branch_id = o.branch_id
    LEFT JOIN classes c ON c.class_id = o.class_id
    LEFT JOIN sections sec ON sec.section_id = o.section_id
    WHERE o.status = 1
      AND (
        CONCAT(s.first_name, ' ', s.last_name) ILIKE $1
        OR b.branch_name ILIKE $1
        OR c.class_name ILIKE $1
        OR sec.section_name ILIKE $1
        OR TO_CHAR(o.created_at, 'YYYY-MM-DD') ILIKE $1
      )
  `;

    const countParams = params.slice(0, page && limit ? params.length - 2 : params.length);
    const countResult = await this.dataSource.query(countQuery, countParams);
    const totalRecords = Number(countResult[0].count);

    return {
      status: true,
      message: 'Order search results fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }


  async filterOrders(filters: any, page?: number, limit?: number) {
    const params: any[] = [];
    let conditions = `WHERE o.status = 1`;
    let idx = 1;

    console.log(filters);

    // Filter by names (text search)
    if (filters.branch_name?.trim()) {
      conditions += ` AND b.branch_name ILIKE $${idx++}`;
      params.push(`%${filters.branch_name.trim()}%`);
    }

    if (filters.class_name?.trim()) {
      conditions += ` AND c.class_name ILIKE $${idx++}`;
      params.push(`%${filters.class_name.trim()}%`);
    }

    if (filters.section_name?.trim()) {
      conditions += ` AND sec.section_name ILIKE $${idx++}`;
      params.push(`%${filters.section_name.trim()}%`);
    }

    if (filters.student_name?.trim()) {
      conditions += ` AND CONCAT(s.first_name, ' ', s.last_name) ILIKE $${idx++}`;
      params.push(`%${filters.student_name.trim()}%`);
    }

    // Date range
    // if (filters.order_date_from) {
    //   conditions += ` AND o.created_at >= $${idx++}`;
    //   params.push(filters.order_date_from);
    // }

    // if (filters.order_date_to) {
    //   conditions += ` AND o.created_at <= $${idx++}`;
    //   params.push(filters.order_date_to);
    // }

    // // Amount range
    // if (filters.min_total !== undefined && filters.min_total !== null) {
    //   conditions += ` AND o.total_amount >= $${idx++}`;
    //   params.push(filters.min_total);
    // }

    // if (filters.max_total !== undefined && filters.max_total !== null) {
    //   conditions += ` AND o.total_amount <= $${idx++}`;
    //   params.push(filters.max_total);
    // }

    let query = `
    SELECT 
      o.order_id,
      o.branch_id,
      b.branch_name,
      o.class_id,
      c.class_name,
      o.section_id,
      sec.section_name,
      o.student_id,
      CONCAT(s.first_name, ' ', s.last_name) AS student_name,
      o.total_amount AS total_price,
      o.created_at AS order_date
    FROM orders o
    LEFT JOIN students s ON s.student_id = o.student_id
    LEFT JOIN branches b ON b.branch_id = o.branch_id
    LEFT JOIN classes c ON c.class_id = o.class_id
    LEFT JOIN sections sec ON sec.section_id = o.section_id
    ${conditions}
    ORDER BY o.order_id DESC
  `;

    if (page && limit) {
      const offset = (page - 1) * limit;
      query += ` LIMIT $${idx++} OFFSET $${idx++}`;
      params.push(limit, offset);
    }

    const data = await this.dataSource.query(query, params);

    if (!page || !limit) {
      return {
        status: true,
        message: 'Orders filtered successfully',
        data,
        totalRecords: data.length,
      };
    }

    let countQuery = `
    SELECT COUNT(*) 
    FROM orders o
    LEFT JOIN branches b ON b.branch_id = o.branch_id
    LEFT JOIN classes c ON c.class_id = o.class_id
    LEFT JOIN sections sec ON sec.section_id = o.section_id
    LEFT JOIN students s ON s.student_id = o.student_id
    ${conditions}
  `;

    const countParams = params.slice(0, params.length - 2);
    const countResult = await this.dataSource.query(countQuery, countParams);
    const totalRecords = Number(countResult[0].count);
    const totalPages = Math.ceil(totalRecords / limit);

    return {
      status: true,
      message: 'Orders filtered successfully',
      data,
      totalRecords,
      totalPages,
    };
  }


  async deleteOrder(order_id: number) {
    if (!order_id) throw new BadRequestException('order_id is required');

    const client = this.dataSource.createQueryRunner();
    await client.connect();
    await client.startTransaction();

    try {
      // Check order exists
      const order = await client.query(
        `SELECT order_id FROM orders WHERE order_id = $1 AND status = 1`,
        [order_id],
      );
      if (!order.length) throw new NotFoundException('Order not found');

      // Restore stock
      const items = await client.query(
        `SELECT product_id, quantity FROM order_items WHERE order_id = $1`,
        [order_id],
      );

      for (const item of items) {
        await client.query(
          `UPDATE products SET stock = stock + $1 WHERE product_id = $2 AND status = 1`,
          [item.quantity, item.product_id],
        );
      }

      // Soft delete order
      await client.query(
        `UPDATE orders SET status = 0, updated_at = NOW() WHERE order_id = $1`,
        [order_id],
      );

      await client.commitTransaction();
      return { status: true, message: 'Order deleted successfully' };
    } catch (err) {
      await client.rollbackTransaction();
      throw err;
    } finally {
      await client.release();
    }
  }
}
