import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateBookDto, IssueBookDto } from './library.dto';

@Injectable()
export class LibraryService {
  constructor(private readonly dataSource: DataSource) { }

  async createBook(dto: CreateBookDto) {
    // Check duplicate ISBN in same branch
    const exists = await this.dataSource.query(
      `SELECT book_id FROM books WHERE isbn = $1 AND branch_id = $2 AND status = 1`,
      [dto.isbn, dto.branch_id],
    );

    if (exists.length > 0) {
      throw new BadRequestException(
        'Book with this ISBN already exists in the branch',
      );
    }

    const now = new Date();

    await this.dataSource.query(
      `
    INSERT INTO books
    (isbn, title, author, category, publisher, total_copies, available_copies, branch_id, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, $9, $9)
    `,
      [
        dto.isbn,
        dto.title,
        dto.author,
        dto.category,
        dto.publisher,
        dto.total_copies,
        dto.available_copies,
        dto.branch_id,
        now,
      ],
    );

    return { status: true, message: 'Book added successfully' };
  }

  async updateBook(book_id: number, dto: any) {
    if (!book_id) {
      throw new BadRequestException('book_id is required');
    }

    const exists = await this.dataSource.query(
      `SELECT book_id, branch_id FROM books WHERE book_id = $1 AND status = 1`,
      [book_id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Book not found');
    }

    const currentBranchId = exists[0].branch_id;

    // Check duplicate ISBN in the same branch (excluding current book)
    if (dto.isbn) {
      const duplicate = await this.dataSource.query(
        `
      SELECT book_id FROM books 
      WHERE isbn = $1 AND branch_id = $2 AND book_id != $3 AND status = 1
      `,
        [dto.isbn, currentBranchId, book_id],
      );

      if (duplicate.length > 0) {
        throw new BadRequestException('ISBN already exists in this branch');
      }
    }

    await this.dataSource.query(
      `
    UPDATE books
    SET
      isbn = $1,
      title = $2,
      author = $3,
      category = $4,
      publisher = $5,
      total_copies = $6,
      available_copies = $7,
      branch_id = $8,
      updated_at = NOW()
    WHERE book_id = $9
    `,
      [
        dto.isbn,
        dto.title,
        dto.author,
        dto.category,
        dto.publisher,
        dto.total_copies,
        dto.available_copies,
        dto.branch_id || currentBranchId, // allow changing branch
        book_id,
      ],
    );

    return { status: true, message: 'Book updated successfully' };
  }

  async getAllBooks(page?: number, limit?: number) {
    let baseQuery = `
    SELECT
      b.book_id,
      b.isbn,
      b.title,
      b.author,
      b.category,
      b.publisher,
      b.total_copies,
      b.available_copies,
      b.branch_id,
      br.branch_name
    FROM books b
    LEFT JOIN branches br ON br.branch_id = b.branch_id
    WHERE b.status = 1
    ORDER BY b.book_id ASC
  `;

    if (!page || !limit) {
      const data = await this.dataSource.query(baseQuery);
      return {
        status: true,
        message: 'All books fetched successfully',
        data,
        totalRecords: data.length,
      };
    }

    const offset = (page - 1) * limit;

    const countRes = await this.dataSource.query(
      `SELECT COUNT(*) FROM books WHERE status = 1`,
    );
    const total = Number(countRes[0].count);

    baseQuery += ` LIMIT $1 OFFSET $2`;
    const data = await this.dataSource.query(baseQuery, [limit, offset]);

    return {
      status: true,
      message: 'Paginated books fetched successfully',
      data,
      totalRecords: total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getBookById(book_id: number) {
    if (!book_id) {
      throw new BadRequestException('book_id is required');
    }

    const result = await this.dataSource.query(
      `
    SELECT
      b.book_id,
      b.isbn,
      b.title,
      b.author,
      b.category,
      b.publisher,
      b.total_copies,
      b.available_copies,
      b.branch_id,
      br.branch_name
    FROM books b
    LEFT JOIN branches br ON br.branch_id = b.branch_id
    WHERE b.book_id = $1 AND b.status = 1
    `,
      [book_id],
    );

    if (result.length === 0) {
      throw new NotFoundException('Book not found');
    }

    return {
      status: true,
      message: 'Book fetched successfully',
      data: result[0],
    };
  }

  async getBooksByBranchId(branch_id: number) {
    if (!branch_id) {
      throw new BadRequestException('branch_id is required');
    }

    const result = await this.dataSource.query(
      `
    SELECT
      b.book_id,
      b.isbn,
      b.title
    FROM books b
    WHERE b.branch_id = $1 AND b.status = 1
    `,
      [branch_id],
    );

    return {
      status: true,
      message: result.length ? 'Book Fetched' : 'No Book found in this branch',
      data: result,
    };
  }

  async deleteBook(book_id: number) {
    if (!book_id) {
      throw new BadRequestException('book_id is required');
    }

    const exists = await this.dataSource.query(
      `SELECT book_id FROM books WHERE book_id = $1 AND status = 1`,
      [book_id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Book not found');
    }

    await this.dataSource.query(
      `UPDATE books SET status = 0, updated_at = NOW() WHERE book_id = $1`,
      [book_id],
    );

    return { status: true, message: 'Book deleted successfully' };
  }

  async searchBooks(keyword: string, page?: number, limit?: number) {
    const search = `%${keyword.trim()}%`;

    let baseQuery = `
    SELECT
      b.book_id,
      b.isbn,
      b.title,
      b.author,
      b.category,
      b.publisher,
      b.total_copies,
      b.available_copies,
      b.branch_id,
      br.branch_name
    FROM books b
    LEFT JOIN branches br ON br.branch_id = b.branch_id
    WHERE b.status = 1
      AND (
        b.isbn ILIKE $1
        OR b.title ILIKE $1
        OR b.author ILIKE $1
        OR b.category ILIKE $1
        OR b.publisher ILIKE $1
        OR br.branch_name ILIKE $1
      )
    ORDER BY b.book_id ASC
  `;

    if (!page || !limit) {
      const data = await this.dataSource.query(baseQuery, [search]);
      return {
        status: true,
        message: 'Books search results fetched successfully',
        data,
        totalRecords: data.length,
      };
    }

    const offset = (page - 1) * limit;

    const countQuery = `
    SELECT COUNT(*)
    FROM books b
    LEFT JOIN branches br ON br.branch_id = b.branch_id
    WHERE b.status = 1
      AND (
        b.isbn ILIKE $1
        OR b.title ILIKE $1
        OR b.author ILIKE $1
        OR b.category ILIKE $1
        OR b.publisher ILIKE $1
        OR br.branch_name ILIKE $1
      )
  `;

    const countRes = await this.dataSource.query(countQuery, [search]);
    const totalRecords = Number(countRes[0].count);

    baseQuery += ` LIMIT $2 OFFSET $3`;

    const data = await this.dataSource.query(baseQuery, [
      search,
      limit,
      offset,
    ]);

    return {
      status: true,
      message: 'Books search results fetched successfully',
      data,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
    };
  }

  async filterBooks(filters: any, page?: number, limit?: number) {
    const params: any[] = [];
    let conditions = `WHERE b.status = 1`;
    let idx = 1;

    if (filters.branch_id) {
      conditions += ` AND b.branch_id = $${idx++}`;
      params.push(filters.branch_id);
    }

    if (typeof filters.isbn === 'string' && filters.isbn.trim() !== '') {
      conditions += ` AND b.isbn ILIKE $${idx++}`;
      params.push(`%${filters.isbn.trim()}%`);
    }

    if (typeof filters.title === 'string' && filters.title.trim() !== '') {
      conditions += ` AND b.title ILIKE $${idx++}`;
      params.push(`%${filters.title.trim()}%`);
    }

    if (typeof filters.author === 'string' && filters.author.trim() !== '') {
      conditions += ` AND b.author ILIKE $${idx++}`;
      params.push(`%${filters.author.trim()}%`);
    }

    if (
      typeof filters.category === 'string' &&
      filters.category.trim() !== ''
    ) {
      conditions += ` AND LOWER(b.category) = LOWER($${idx++})`;
      params.push(filters.category.trim());
    }

    if (
      typeof filters.publisher === 'string' &&
      filters.publisher.trim() !== ''
    ) {
      conditions += ` AND b.publisher ILIKE $${idx++}`;
      params.push(`%${filters.publisher.trim()}%`);
    }

    if (filters.available_only === true) {
      conditions += ` AND b.available_copies > 0`;
    }

    let baseQuery = `
    SELECT
      b.book_id,
      b.isbn,
      b.title,
      b.author,
      b.category,
      b.publisher,
      b.total_copies,
      b.available_copies,
      b.branch_id,
      br.branch_name
    FROM books b
    LEFT JOIN branches br ON br.branch_id = b.branch_id
    ${conditions}
    ORDER BY b.book_id ASC
  `;

    if (!page || !limit) {
      const data = await this.dataSource.query(baseQuery, params);
      return {
        status: true,
        message: 'Books filtered successfully',
        data,
        totalRecords: data.length,
      };
    }

    const offset = (page - 1) * limit;
    baseQuery += ` LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const data = await this.dataSource.query(baseQuery, params);

    const countQuery = `SELECT COUNT(*) FROM books b ${conditions}`;
    const countParams = params.slice(0, params.length - 2);
    const totalRecords = Number(
      (await this.dataSource.query(countQuery, countParams))[0].count,
    );

    return {
      status: true,
      message: 'Books filtered successfully',
      data,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
    };
  }

  /* ISSUE BOOK */
  // async issueBook(dto: IssueBookDto) {
  //   const issuedDate = new Date(dto.issued_date);
  //   const returnDate = new Date(dto.return_date);

  //   if (returnDate <= issuedDate) {
  //     throw new BadRequestException('Return date must be after issue date');
  //   }

  //   const book = await this.dataSource.query(
  //     `SELECT available_copies FROM books WHERE book_id = $1 AND status = 1`,
  //     [dto.book_id],
  //   );

  //   if (book.length === 0 || book[0].available_copies <= 0) {
  //     throw new BadRequestException('Book not available');
  //   }

  //   await this.dataSource.query(
  //     `
  //   INSERT INTO book_issue
  //   (book_id, issued_to, issued_to_id, issued_date, return_date, fine_amount, status)
  //   VALUES ($1,$2,$3,$4,$5,$6,1)
  //   `,
  //     [
  //       dto.book_id,
  //       dto.issued_to,
  //       dto.issued_to_id,
  //       dto.issued_date,
  //       dto.return_date,
  //       dto.fine_amount,
  //     ],
  //   );

  //   await this.dataSource.query(
  //     `UPDATE books SET available_copies = available_copies - 1 WHERE book_id = $1`,
  //     [dto.book_id],
  //   );

  //   return { status: true, message: 'Book issued successfully' };
  // }

  // async updateIssueBook(issue_id: number, dto: IssueBookDto) {
  //   if (!issue_id) {
  //     throw new BadRequestException('issue_id is required');
  //   }

  //   const exists = await this.dataSource.query(
  //     `SELECT issue_id FROM book_issue WHERE issue_id = $1 AND status = 1`,
  //     [issue_id],
  //   );

  //   if (exists.length === 0) {
  //     throw new NotFoundException('Issued record not found');
  //   }

  //   await this.dataSource.query(
  //     `
  //   UPDATE book_issue
  //   SET
  //     issued_to = $1,
  //     issued_to_id = $2,
  //     issued_date = $3,
  //     return_date = $4,
  //     fine_amount = $5
  //   WHERE issue_id = $6
  //   `,
  //     [
  //       dto.issued_to,
  //       dto.issued_to_id,
  //       dto.issued_date,
  //       dto.return_date ?? null,
  //       dto.fine_amount ?? 0,
  //       issue_id,
  //     ],
  //   );

  //   return { status: true, message: 'Issued book updated successfully' };
  // }

  async issueBook(dto: IssueBookDto) {
    const issuedDate = new Date(dto.issued_date);
    const returnDate = new Date(dto.return_date);

    if (returnDate <= issuedDate) {
      throw new BadRequestException('Return date must be after issue date');
    }

    // Validate required new fields
    if (!dto.branch_id) {
      throw new BadRequestException('Branch is required');
    }

    // Check if book exists and is available in the specific branch
    const book = await this.dataSource.query(
      `
    SELECT available_copies 
    FROM books 
    WHERE book_id = $1 
      AND branch_id = $2 
      AND status = 1
    `,
      [dto.book_id, dto.branch_id],
    );

    if (book.length === 0) {
      throw new NotFoundException('Book not found in this branch');
    }

    if (book[0].available_copies <= 0) {
      throw new BadRequestException('Book not available for issue');
    }

    const now = new Date();

    // Insert into book_issue with new fields
    await this.dataSource.query(
      `
    INSERT INTO book_issue
    (book_id, issued_to, issued_to_id, branch_id, class_id, section_id, issued_date, return_date, fine_amount, status, issue_status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1, 'issued', $10, $10)
    `,
      [
        dto.book_id,
        dto.issued_to,
        dto.issued_to_id,
        dto.branch_id,
        dto.class_id ?? null,
        dto.section_id ?? null,
        dto.issued_date,
        dto.return_date,
        dto.fine_amount ?? 0,
        now,
      ],
    );

    // Decrease available copies
    await this.dataSource.query(
      `UPDATE books SET available_copies = available_copies - 1 WHERE book_id = $1 AND branch_id = $2`,
      [dto.book_id, dto.branch_id],
    );

    return { status: true, message: 'Book issued successfully' };
  }

  async updateIssueBook(issue_id: number, dto: IssueBookDto) {
    if (!issue_id) {
      throw new BadRequestException('issue_id is required');
    }

    const exists = await this.dataSource.query(
      `SELECT issue_id, book_id, branch_id FROM book_issue WHERE issue_id = $1 AND status = 1`,
      [issue_id],
    );

    if (exists.length === 0) {
      throw new NotFoundException('Issued record not found');
    }

    const currentBookId = exists[0].book_id;
    const currentBranchId = exists[0].branch_id;

    // Optional: If changing book or branch, validate availability
    if (dto.book_id && dto.book_id !== currentBookId) {
      const book = await this.dataSource.query(
        `SELECT available_copies FROM books WHERE book_id = $1 AND branch_id = $2 AND status = 1`,
        [dto.book_id, dto.branch_id || currentBranchId],
      );

      if (book.length === 0 || book[0].available_copies <= 0) {
        throw new BadRequestException('Selected book is not available');
      }
    }

    await this.dataSource.query(
      `
    UPDATE book_issue
    SET
      book_id = $1,
      issued_to = $2,
      issued_to_id = $3,
      branch_id = $4,
      class_id = $5,
      section_id = $6,
      issued_date = $7,
      return_date = $8,
      fine_amount = $9,
      updated_at = NOW()
    WHERE issue_id = $10
    `,
      [
        dto.book_id ?? currentBookId,
        dto.issued_to,
        dto.issued_to_id,
        dto.branch_id || currentBranchId,
        dto.class_id,
        dto.section_id,
        dto.issued_date,
        dto.return_date ?? null,
        dto.fine_amount ?? 0,
        issue_id,
      ],
    );

    return { status: true, message: 'Issued book updated successfully' };
  }

  async getAllIssuesBook(page?: number, limit?: number) {
    let baseQuery = `
    SELECT
      bi.issue_id,
      bi.branch_id,
      br.branch_name,
      bi.book_id,
      b.title AS book_title,
      bi.issued_to,
      bi.issued_to_id,
      bi.class_id,
      bi.section_id,
      c.class_name,
      sec.section_name,

      CASE
        WHEN bi.issued_to = 'student'
          THEN CONCAT(s.first_name, ' ', s.last_name)
        WHEN bi.issued_to = 'teacher'
          THEN CONCAT(t.first_name, ' ', t.last_name)
        ELSE NULL
      END AS issued_to_name,

      bi.issued_date,
      bi.return_date,
      bi.fine_amount,
      bi.issue_status
    FROM book_issue bi
    INNER JOIN books b ON b.book_id = bi.book_id
    LEFT JOIN branches br ON br.branch_id = bi.branch_id
    LEFT JOIN classes c ON c.class_id = bi.class_id
    LEFT JOIN sections sec ON sec.section_id = bi.section_id
    LEFT JOIN students s 
      ON bi.issued_to = 'student' AND s.student_id = bi.issued_to_id
    LEFT JOIN teachers t 
      ON bi.issued_to = 'teacher' AND t.teacher_id = bi.issued_to_id
    WHERE bi.status = 1
    ORDER BY bi.issue_id DESC  -- Usually DESC for latest first
  `;

    if (!page || !limit) {
      const data = await this.dataSource.query(baseQuery);
      return {
        status: true,
        message: 'All issued books fetched successfully',
        data,
        totalRecords: data.length,
      };
    }

    const offset = (page - 1) * limit;

    const countRes = await this.dataSource.query(
      `SELECT COUNT(*) FROM book_issue WHERE status = 1`,
    );
    const total = Number(countRes[0].count);

    baseQuery += ` LIMIT $1 OFFSET $2`;
    const data = await this.dataSource.query(baseQuery, [limit, offset]);

    return {
      status: true,
      message: 'Paginated issued books fetched successfully',
      data,
      totalRecords: total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getIssueBookById(issue_id: number) {
    if (!issue_id) {
      throw new BadRequestException('issue_id is required');
    }

    const result = await this.dataSource.query(
      `
    SELECT
      bi.issue_id,
      bi.book_id,
      bi.branch_id,
      bi.class_id,
      bi.section_id,
      b.title AS book_title,
      bi.issued_to,
      bi.issued_to_id,
      bi.issued_date,
      bi.return_date,
      bi.fine_amount,
      bi.issue_status
    FROM book_issue bi
    INNER JOIN books b ON b.book_id = bi.book_id
    WHERE bi.issue_id = $1 AND bi.status = 1
    `,
      [issue_id],
    );

    if (result.length === 0) {
      throw new NotFoundException('Issued record not found');
    }

    return {
      status: true,
      message: 'Issued book fetched successfully',
      data: result[0],
    };
  }

  async deleteIssueBook(issue_id: number) {
    if (!issue_id) {
      throw new BadRequestException('issue_id is required');
    }

    const issue = await this.dataSource.query(
      `
    SELECT issue_id, book_id 
    FROM book_issue 
    WHERE issue_id = $1 AND status = 1
    `,
      [issue_id],
    );

    if (issue.length === 0) {
      throw new NotFoundException('Issued record not found');
    }

    // Soft delete issue
    await this.dataSource.query(
      `UPDATE book_issue SET status = 0 WHERE issue_id = $1`,
      [issue_id],
    );

    // Restore available copies
    await this.dataSource.query(
      `UPDATE books SET available_copies = available_copies + 1 WHERE book_id = $1`,
      [issue[0].book_id],
    );

    return { status: true, message: 'Issued book deleted successfully' };
  }

  async searchIssuedBooks(keyword: string, page?: number, limit?: number) {
    if (!keyword?.trim()) {
      throw new BadRequestException('Search keyword is required');
    }

    const search = `%${keyword.trim()}%`;
    const params: any[] = [search];
    let pagination = '';

    if (page && limit) {
      pagination = ` LIMIT $2 OFFSET $3`;
      params.push(limit, (page - 1) * limit);
    }

    const query = `
    SELECT
      bi.issue_id,
      bi.book_id,
      b.title AS book_title,
      bi.branch_id,
      br.branch_name,
      bi.class_id,
      c.class_name,
      bi.section_id,
      sec.section_name,
      bi.issued_to,
      bi.issued_to_id,

      CASE
        WHEN bi.issued_to = 'student'
          THEN CONCAT(s.first_name, ' ', s.last_name)
        WHEN bi.issued_to = 'teacher'
          THEN CONCAT(t.first_name, ' ', t.last_name)
        ELSE NULL
      END AS issued_to_name,

      bi.issued_date,
      bi.return_date,
      bi.fine_amount,
      bi.issue_status
    FROM book_issue bi
    INNER JOIN books b ON b.book_id = bi.book_id
    LEFT JOIN branches br ON br.branch_id = bi.branch_id
    LEFT JOIN classes c ON c.class_id = bi.class_id
    LEFT JOIN sections sec ON sec.section_id = bi.section_id
    LEFT JOIN students s 
      ON bi.issued_to = 'student' AND s.student_id = bi.issued_to_id
    LEFT JOIN teachers t 
      ON bi.issued_to = 'teacher' AND t.teacher_id = bi.issued_to_id
    WHERE bi.status = 1
      AND (
        b.title ILIKE $1
        OR br.branch_name ILIKE $1
        OR c.class_name ILIKE $1
        OR sec.section_name ILIKE $1
        OR (bi.issued_to = 'student' AND CONCAT(s.first_name, ' ', s.last_name) ILIKE $1)
        OR (bi.issued_to = 'teacher' AND CONCAT(t.first_name, ' ', t.last_name) ILIKE $1)
        OR bi.issued_to::text ILIKE $1
      )
    ORDER BY bi.issue_id DESC
    ${pagination}
  `;

    const data = await this.dataSource.query(query, params);

    // Count query
    const countQuery = `
    SELECT COUNT(*)
    FROM book_issue bi
    INNER JOIN books b ON b.book_id = bi.book_id
    LEFT JOIN branches br ON br.branch_id = bi.branch_id
    LEFT JOIN classes c ON c.class_id = bi.class_id
    LEFT JOIN sections sec ON sec.section_id = bi.section_id
    LEFT JOIN students s 
      ON bi.issued_to = 'student' AND s.student_id = bi.issued_to_id
    LEFT JOIN teachers t 
      ON bi.issued_to = 'teacher' AND t.teacher_id = bi.issued_to_id
    WHERE bi.status = 1
      AND (
        b.title ILIKE $1
        OR br.branch_name ILIKE $1
        OR c.class_name ILIKE $1
        OR sec.section_name ILIKE $1
        OR (bi.issued_to = 'student' AND CONCAT(s.first_name, ' ', s.last_name) ILIKE $1)
        OR (bi.issued_to = 'teacher' AND CONCAT(t.first_name, ' ', t.last_name) ILIKE $1)
        OR bi.fine_amount::text ILIKE $1
      )
  `;

    const countParams = [search];
    const totalRecords = Number(
      (await this.dataSource.query(countQuery, countParams))[0].count,
    );

    return {
      status: true,
      message: 'Issued books search results fetched successfully',
      data,
      totalRecords,
      totalPages: page && limit ? Math.ceil(totalRecords / limit) : 1,
    };
  }

  async filterIssuedBooks(filters: any, page?: number, limit?: number) {
    const params: any[] = [];
    let conditions = `WHERE bi.status = 1`;
    let idx = 1;

    if (filters.branch_name?.trim()) {
      conditions += ` AND br.branch_name ILIKE $${idx++}`;
      params.push(`%${filters.branch_name.trim()}%`);
    }

    // if (filters.class_name?.trim()) {
    //   conditions += ` AND c.class_name ILIKE $${idx++}`;
    //   params.push(`%${filters.class_name.trim()}%`);
    // }

    // if (filters.section_name?.trim()) {
    //   conditions += ` AND sec.section_name ILIKE $${idx++}`;
    //   params.push(`%${filters.section_name.trim()}%`);
    // }

    if (filters.book_title?.trim()) {
      conditions += ` AND b.title ILIKE $${idx++}`;
      params.push(`%${filters.book_title.trim()}%`);
    }

    // if (filters.student_name?.trim()) {
    //   conditions += ` AND (bi.issued_to = 'student' AND CONCAT(s.first_name, ' ', s.last_name) ILIKE $${idx++})`;
    //   params.push(`%${filters.student_name.trim()}%`);
    // }

    // if (filters.teacher_name?.trim()) {
    //   conditions += ` AND (bi.issued_to = 'teacher' AND CONCAT(t.first_name, ' ', t.last_name) ILIKE $${idx++})`;
    //   params.push(`%${filters.teacher_name.trim()}%`);
    // }

    if (filters.from_date) {
      conditions += ` AND bi.issued_date >= $${idx++}`;
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      conditions += ` AND bi.issued_date <= $${idx++}`;
      params.push(filters.to_date);
    }

    const baseQuery = `
    SELECT
      bi.issue_id,
      bi.book_id,
      b.title AS book_title,
      bi.branch_id,
      br.branch_name,
      bi.class_id,
      c.class_name,
      bi.section_id,
      sec.section_name,
      bi.issued_to,
      bi.issued_to_id,

      CASE
        WHEN bi.issued_to = 'student'
          THEN CONCAT(s.first_name, ' ', s.last_name)
        WHEN bi.issued_to = 'teacher'
          THEN CONCAT(t.first_name, ' ', t.last_name)
        ELSE NULL
      END AS issued_to_name,

      bi.issued_date,
      bi.return_date,
      bi.fine_amount,
      bi.issue_status
    FROM book_issue bi
    INNER JOIN books b ON b.book_id = bi.book_id
    LEFT JOIN branches br ON br.branch_id = bi.branch_id
    LEFT JOIN classes c ON c.class_id = bi.class_id
    LEFT JOIN sections sec ON sec.section_id = bi.section_id
    LEFT JOIN students s 
      ON bi.issued_to = 'student' AND s.student_id = bi.issued_to_id
    LEFT JOIN teachers t 
      ON bi.issued_to = 'teacher' AND t.teacher_id = bi.issued_to_id
    ${conditions}
    ORDER BY bi.issue_id DESC
  `;

    if (!page || !limit) {
      const data = await this.dataSource.query(baseQuery, params);
      return {
        status: true,
        message: 'Issued books filtered successfully',
        data,
        totalRecords: data.length,
      };
    }

    const offset = (page - 1) * limit;
    const paginatedQuery = baseQuery + ` LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const data = await this.dataSource.query(paginatedQuery, params);

    const countQuery = `SELECT COUNT(*) FROM book_issue bi ${conditions}`;
    const countParams = params.slice(0, params.length - 2);
    const totalRecords = Number(
      (await this.dataSource.query(countQuery, countParams))[0].count,
    );

    return {
      status: true,
      message: 'Issued books filtered successfully',
      data,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
    };
  }

  /*RETURN BOOK */
  async returnBook(issue_id: number, fine_amount?: number) {
    const issue = await this.dataSource.query(
      `SELECT book_id FROM book_issue WHERE issue_id = $1 AND status = 1`,
      [issue_id],
    );

    if (issue.length === 0) {
      throw new NotFoundException('Issue record not found');
    }

    await this.dataSource.query(
      `
      UPDATE book_issue
      SET return_date = CURRENT_DATE, fine_amount = $1, issue_status = 'returned'
      WHERE issue_id = $2
      `,
      [fine_amount ?? 0, issue_id],
    );

    await this.dataSource.query(
      `UPDATE books SET available_copies = available_copies + 1 WHERE book_id = $1`,
      [issue[0].book_id],
    );

    return { status: true, message: 'Book returned successfully' };
  }
}
