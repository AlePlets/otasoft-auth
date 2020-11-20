import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

import { AuthConfirmationDto, ChangePasswordDto } from '../dto';
import { GetUserIdDto } from '../dto/get-user-id.dto';
import { UserService } from '../services/user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern({ role: 'auth', cmd: 'getId' })
  async getUserId(getUserIdDto: GetUserIdDto): Promise<{ auth_id: number }> {
    return this.userService.getUserId(getUserIdDto);
  }

  @MessagePattern({ role: 'auth', cmd: 'changePassword' })
  async changeUserPassword(
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ response: string }> {
    return this.userService.changeUserPassword(changePasswordDto);
  }

  @MessagePattern({ role: 'auth', cmd: 'deleteAccount' })
  async deleteUserAccount(id: number): Promise<{ response: string }> {
    return this.userService.deleteUserAccount(id);
  }

  @MessagePattern({ role: 'auth', cmd: 'confirm' })
  async confirmAccountCreation(
    authConfirmationDto: AuthConfirmationDto,
  ): Promise<void> {
    return this.userService.confirmAccountCreation(authConfirmationDto);
  }
}
