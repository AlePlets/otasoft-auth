import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { JwtTokenService } from '../../../auth/passport-jwt/services';
import { IJwtPayload } from '../../../auth/passport-jwt/interfaces';
import { UserEntity } from '../../../db/entities';
import { RpcExceptionService } from '../../../utils/exception-handling';
import {
  ChangeUserPasswordCommand,
  ConfirmAccountCreationCommand,
  DeleteUserAccountCommand,
  RemoveRefreshTokenCommand,
  SetNewPasswordCommand,
} from '../commands/impl';
import { GenerateForgotPasswordTokenCommand } from '../commands/impl/generate-forgot-password-token.command';
import {
  AuthConfirmationDto,
  AuthEmailDto,
  ChangePasswordDto,
  GetRefreshUserDto,
  GetUserIdDto,
  SetNewPasswordDto,
} from '../dto';
import { IConfirmedAccountObject } from '../interfaces';
import {
  AuthEmailModel,
  AuthIdModel,
  ForgotPasswordTokenModel,
  StringResponse,
} from '../models';
import {
  GetConfirmedUserQuery,
  GetRefreshUserQuery,
  GetUserByEmailQuery,
  GetUserByIdQuery,
  GetUserIdQuery,
} from '../queries/impl';

@Injectable()
export class UserService {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly rpcExceptionService: RpcExceptionService,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  async getUserId(getUserIdDto: GetUserIdDto): Promise<AuthIdModel> {
    return this.queryBus.execute(new GetUserIdQuery(getUserIdDto));
  }

  async getUserIfRefreshTokenMatches(
    getRefreshUserIdDto: GetRefreshUserDto,
  ): Promise<UserEntity> {
    return this.queryBus.execute(new GetRefreshUserQuery(getRefreshUserIdDto));
  }

  async getUserById(id: number): Promise<UserEntity> {
    return this.queryBus.execute(new GetUserByIdQuery(id));
  }

  async getUserByEmail(email: string): Promise<UserEntity> {
    return this.queryBus.execute(new GetUserByEmailQuery(email));
  }

  async changeUserPassword(
    changePasswordDto: ChangePasswordDto,
  ): Promise<StringResponse> {
    return this.commandBus.execute(
      new ChangeUserPasswordCommand(changePasswordDto),
    );
  }

  async deleteUserAccount(id: number): Promise<StringResponse> {
    return this.commandBus.execute(new DeleteUserAccountCommand(id));
  }

  async confirmAccountCreation(
    authConfirmationDto: AuthConfirmationDto,
  ): Promise<void> {
    const accountConfirmObject: IConfirmedAccountObject = await this.queryBus.execute(
      new GetConfirmedUserQuery(authConfirmationDto),
    );

    if (!accountConfirmObject) this.rpcExceptionService.throwBadRequest();

    await this.commandBus.execute(
      new ConfirmAccountCreationCommand(accountConfirmObject),
    );
  }

  async removeRefreshToken(userId: number): Promise<void> {
    return await this.commandBus.execute(new RemoveRefreshTokenCommand(userId));
  }

  async forgotPassword(
    authEmailDto: AuthEmailDto,
  ): Promise<ForgotPasswordTokenModel> {
    const user: UserEntity = await this.queryBus.execute(
      new GetUserByEmailQuery(authEmailDto.email),
    );

    if (!user) return;

    const token = await this.commandBus.execute(
      new GenerateForgotPasswordTokenCommand(user.id, user.email),
    );

    return token;
  }

  async setNewPassword(
    setNewPasswordDto: SetNewPasswordDto,
  ): Promise<AuthEmailModel> {
    const payload: IJwtPayload = this.jwtTokenService.verifyToken(
      setNewPasswordDto.forgotPasswordToken,
    );

    if (!payload.userEmail || !payload.userId)
      this.rpcExceptionService.throwUnauthorised('Token expired or broken');

    return await this.commandBus.execute(
      new SetNewPasswordCommand(setNewPasswordDto.newPassword, payload.userId),
    );
  }
}
