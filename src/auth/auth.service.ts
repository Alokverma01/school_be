import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource, // ✅ Inject DataSource
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, password: string, res) {
    if (!username || !password) {
      throw new BadRequestException('Username & Password are required');
    }

    

    const query = `
    SELECT 
      u.user_id,
      u.username,
      u.password,
      u.email,
      u.first_name,
      u.last_name,
      u.contact_number,
      u.status,
      r.role_id,
      r.role_name,
      r.access,
      d.department_name,
      rt.user_id AS reporting_to_id,
      rt.first_name AS reporting_to_first,
      rt.last_name AS reporting_to_last
    FROM users u
    LEFT JOIN roles r ON r.role_id = u.role_id
    LEFT JOIN departments d ON d.department_id = r.department
    LEFT JOIN users rt ON rt.user_id = u.reporting_to
    WHERE u.username = $1 
    LIMIT 1;
  `;

    const result = await this.dataSource.query(query, [username]);

    if (result.length === 0) {
      throw new BadRequestException('User not Found');
    }

    console.log(result);

    const user = result[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new BadRequestException('Invalid username or password');
    }

    const token = this.jwtService.sign({
      user_id: user.user_id,
      username: user.username,
      role_id: user.role_id,
      email: user.email,
    });

    // ---- Place JWT in cookie ----
    res.cookie('auth_token', token, {
      httpOnly: true,
      // secure: false, //Keep false for localhost, true for production
      secure: false, //Keep false for localhost, true for production
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      status: true,
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        username: user.username,
        role_id: user.role_id,
        role_name: user.role_name,
        email: user.email,
        contact_number: user.contact_number,
        name: user.first_name + ' ' + user.last_name,
        department: user.department_name,
        access: user.access,
      },
    };
  }
}