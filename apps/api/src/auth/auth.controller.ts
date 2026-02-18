import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { OrganisationService } from './organisation.service';
import { InviteService } from './invite.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { SignupDto } from './dto/signup.dto';
import { SignupInviteDto } from './dto/signup-invite.dto';
import { LoginDto } from './dto/login.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { ROLES } from '@teamsport/shared';
import { setTokenCookie, clearTokenCookie } from './cookie.utils';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private organisationService: OrganisationService,
    private inviteService: InviteService,
  ) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.authService.signup(
      dto.organisationName,
      dto.email,
      dto.password,
    );
    setTokenCookie(res, token);
    return { user };
  }

  @Post('signup/invite')
  async signupWithInvite(
    @Body() dto: SignupInviteDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, token } = await this.inviteService.acceptInvite(
      dto.email,
      dto.password,
      dto.inviteToken,
    );
    setTokenCookie(res, token);
    return { user };
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.authService.login(dto.email, dto.password);
    setTokenCookie(res, token);
    return { user };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Res({ passthrough: true }) res: Response) {
    clearTokenCookie(res);
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() currentUser: { id: string; role: string }) {
    return this.authService.getMe(currentUser.id);
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    await this.authService.verifyEmail(token);
    return { success: true };
  }

  @Post('invites')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async createInvite(
    @Body() dto: InviteUserDto,
    @CurrentUser() currentUser: { id: string; role: string },
  ) {
    const invite = await this.inviteService.createInvite(
      dto.email,
      currentUser.id,
      '',
    );
    return { id: invite.id, email: invite.email, token: invite.token };
  }

  @Get('invites')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async listInvites(@CurrentUser() currentUser: { id: string; role: string }) {
    const user = await this.authService.getMe(currentUser.id);
    return this.inviteService.listInvites(user.organisationId);
  }

  @Get('org/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async listOrgUsers(@CurrentUser() currentUser: { id: string; role: string }) {
    const user = await this.authService.getMe(currentUser.id);
    return this.userService.listByOrganisation(user.organisationId);
  }

  @Get('organisations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.CONTROL)
  async listOrganisations() {
    return this.organisationService.listAll();
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.CONTROL)
  async listAllUsers() {
    return this.userService.listAll();
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.CONTROL)
  async deleteUser(@Param('id') id: string) {
    await this.userService.deleteUser(id);
    return { success: true };
  }

  @Delete('organisations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.CONTROL)
  async deleteOrganisation(@Param('id') id: string) {
    await this.organisationService.deleteOrganisation(id);
    return { success: true };
  }

  @Patch('users/:id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.CONTROL)
  async changeUserRole(@Param('id') id: string, @Body() dto: ChangeRoleDto) {
    return this.userService.changeRole(id, dto.role);
  }
}
