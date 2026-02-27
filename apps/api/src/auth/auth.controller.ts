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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { OrganisationService } from './organisation.service';
import { InviteService } from './invite.service';
import { ClubService } from './club.service';
import { TeamService } from './team.service';
import { LeagueService } from './league.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { SignupDto } from './dto/signup.dto';
import { SignupInviteDto } from './dto/signup-invite.dto';
import { LoginDto } from './dto/login.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { CreateClubDto } from './dto/create-club.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { ManageMembershipDto } from './dto/manage-membership.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateLeagueDto } from './dto/create-league.dto';
import { CreateFixtureDto } from './dto/create-fixture.dto';
import { UpdateFixtureDto } from './dto/update-fixture.dto';
import { CreateGoalDto } from './dto/create-goal.dto';
import { ROLES } from '@teamsport/shared';
import { setTokenCookie, clearTokenCookie } from './cookie.utils';

const avatarStorage = diskStorage({
  destination: 'uploads/avatars',
  filename: (_req, file, cb) => {
    cb(null, `${uuidv4()}${extname(file.originalname)}`);
  },
});

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private organisationService: OrganisationService,
    private inviteService: InviteService,
    private clubService: ClubService,
    private teamService: TeamService,
    private leagueService: LeagueService,
  ) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.authService.signup(
      dto.organisationName,
      dto.email,
      dto.password,
      dto.clubName,
      dto.teamName,
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

  @Get('me/clubs')
  @UseGuards(JwtAuthGuard)
  async getMyClubs(@CurrentUser() currentUser: { id: string; role: string }) {
    return this.userService.getUserClubsWithTeams(currentUser.id);
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

  // --- Profile endpoints ---

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar', { storage: avatarStorage }))
  async updateProfile(
    @CurrentUser() currentUser: { id: string; role: string },
    @Body() dto: UpdateProfileDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    return this.userService.updateProfile(currentUser.id, dto, avatar);
  }

  @Delete('profile/avatar')
  @UseGuards(JwtAuthGuard)
  async removeAvatar(@CurrentUser() currentUser: { id: string; role: string }) {
    return this.userService.removeAvatar(currentUser.id);
  }

  // --- Club endpoints ---

  @Post('clubs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async createClub(
    @Body() dto: CreateClubDto,
    @CurrentUser() currentUser: { id: string; role: string },
  ) {
    const user = await this.authService.getMe(currentUser.id);
    return this.clubService.create(dto.name, user.organisationId);
  }

  @Get('clubs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async listClubs(@CurrentUser() currentUser: { id: string; role: string }) {
    const user = await this.authService.getMe(currentUser.id);
    return this.clubService.listByOrganisation(user.organisationId);
  }

  @Get('clubs/:id/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async listClubUsers(@Param('id') id: string) {
    return this.clubService.listUsers(id);
  }

  @Post('clubs/:id/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async addUserToClub(@Param('id') id: string, @Body() dto: ManageMembershipDto) {
    await this.clubService.addUser(id, dto.userId);
    return { success: true };
  }

  @Delete('clubs/:id/users/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async removeUserFromClub(@Param('id') id: string, @Param('userId') userId: string) {
    await this.clubService.removeUser(id, userId);
    return { success: true };
  }

  @Patch('clubs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async renameClub(@Param('id') id: string, @Body() dto: CreateClubDto) {
    return this.clubService.rename(id, dto.name);
  }

  @Delete('clubs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async deleteClub(@Param('id') id: string) {
    await this.clubService.delete(id);
    return { success: true };
  }

  // --- Team endpoints ---

  @Post('teams')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async createTeam(@Body() dto: CreateTeamDto) {
    return this.teamService.create(dto.name, dto.clubId);
  }

  @Get('clubs/:id/teams')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async listTeams(@Param('id') id: string) {
    return this.teamService.listByClub(id);
  }

  @Get('teams/:id/users')
  @UseGuards(JwtAuthGuard)
  async listTeamUsers(@Param('id') id: string) {
    return this.teamService.listUsers(id);
  }

  @Post('teams/:id/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async addUserToTeam(@Param('id') id: string, @Body() dto: ManageMembershipDto) {
    await this.teamService.addUser(id, dto.userId);
    return { success: true };
  }

  @Delete('teams/:id/users/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async removeUserFromTeam(@Param('id') id: string, @Param('userId') userId: string) {
    await this.teamService.removeUser(id, userId);
    return { success: true };
  }

  @Patch('teams/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async renameTeam(@Param('id') id: string, @Body() dto: CreateClubDto) {
    return this.teamService.rename(id, dto.name);
  }

  @Delete('teams/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async deleteTeam(@Param('id') id: string) {
    await this.teamService.delete(id);
    return { success: true };
  }

  // --- League endpoints ---

  @Get('leagues')
  @UseGuards(JwtAuthGuard)
  async listLeagues(@CurrentUser() currentUser: { id: string; role: string }) {
    const user = await this.authService.getMe(currentUser.id);
    return this.leagueService.listByOrganisation(user.organisationId);
  }

  @Get('leagues/:id')
  @UseGuards(JwtAuthGuard)
  async getLeagueDetail(@Param('id') id: string) {
    return this.leagueService.getDetail(id);
  }

  @Post('leagues')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async createLeague(
    @Body() dto: CreateLeagueDto,
    @CurrentUser() currentUser: { id: string; role: string },
  ) {
    const user = await this.authService.getMe(currentUser.id);
    return this.leagueService.create(dto.name, dto.type, user.organisationId, dto.clubId);
  }

  @Delete('leagues/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async deleteLeague(@Param('id') id: string) {
    await this.leagueService.deleteLeague(id);
    return { success: true };
  }

  @Get('leagues/:id/participants')
  @UseGuards(JwtAuthGuard)
  async listLeagueParticipants(@Param('id') id: string) {
    return this.leagueService.listParticipants(id);
  }

  @Post('leagues/:id/participants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async addLeagueParticipant(@Param('id') id: string, @Body() body: { teamId: string }) {
    await this.leagueService.addParticipant(id, body.teamId);
    return { success: true };
  }

  @Delete('leagues/:id/participants/:teamId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async removeLeagueParticipant(@Param('id') id: string, @Param('teamId') teamId: string) {
    await this.leagueService.removeParticipant(id, teamId);
    return { success: true };
  }

  @Post('leagues/:id/round-robin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async generateRoundRobin(
    @Param('id') id: string,
    @Body() body: { days: string[]; timeSlots: string[]; force?: boolean },
  ) {
    return this.leagueService.generateRoundRobin(id, {
      days: body.days,
      timeSlots: body.timeSlots,
      force: body.force ?? false,
    });
  }

  @Post('leagues/:id/fixtures')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async createFixture(@Param('id') id: string, @Body() dto: CreateFixtureDto) {
    return this.leagueService.createFixture(id, dto.homeId, dto.awayId, dto.date);
  }

  @Patch('fixtures/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async updateFixture(@Param('id') id: string, @Body() dto: UpdateFixtureDto) {
    return this.leagueService.updateFixture(id, dto);
  }

  @Delete('fixtures/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async deleteFixture(@Param('id') id: string) {
    await this.leagueService.deleteFixture(id);
    return { success: true };
  }

  @Post('fixtures/:id/goals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async createGoal(@Param('id') id: string, @Body() dto: CreateGoalDto) {
    return this.leagueService.createGoal(id, dto.scorerId);
  }

  @Delete('goals/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.ADMIN)
  async deleteGoal(@Param('id') id: string) {
    await this.leagueService.deleteGoal(id);
    return { success: true };
  }
}
