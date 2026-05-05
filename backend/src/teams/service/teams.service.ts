import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Team } from '../entities/team.entity';
import { Role, User } from '../../auth/entities/user.entity';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async createTeam(managerId: number, name: string): Promise<Team> {
    const team = this.teamsRepository.create({ name, managerId });
    return this.teamsRepository.save(team);
  }

  async addMember(
    teamId: number,
    managerId: number,
    userId: number,
  ): Promise<Team> {
    const team = await this.teamsRepository.findOne({
      where: { id: teamId, managerId },
      relations: ['members'],
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (team.members.some((member) => member.id === userId)) {
      return team;
    }

    team.members.push(user);
    return this.teamsRepository.save(team);
  }

  async getAvailableMembers(teamId: number, managerId: number) {
    const team = await this.teamsRepository.findOne({
      where: { id: teamId, managerId },
      relations: ['members'],
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const memberIds = team.members.map((member) => member.id);
    const where = memberIds.length
      ? { role: Role.USER, id: Not(In(memberIds)) }
      : { role: Role.USER };

    const users = await this.usersRepository.find({ where });

    return users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    }));
  }

  async getManagedTeams(managerId: number) {
    const teams = await this.teamsRepository.find({
      where: { managerId },
      relations: ['members'],
    });

    return teams.map((team) => ({
      id: team.id,
      name: team.name,
      memberCount: team.members.length,
    }));
  }

  async getTeamTasks(teamId: number, managerId: number) {
    const team = await this.teamsRepository.findOne({
      where: { id: teamId, managerId },
      relations: ['members', 'members.tasks'],
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return team.members.map((member) => ({
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      role: member.role,
      tasks: member.tasks,
    }));
  }

  async isManagerOfUser(managerId: number, userId: number) {
    const count = await this.teamsRepository
      .createQueryBuilder('team')
      .innerJoin('team.members', 'member', 'member.id = :userId', { userId })
      .where('team.managerId = :managerId', { managerId })
      .getCount();

    return count > 0;
  }

  async getAllTeams(): Promise<Team[]> {
    return this.teamsRepository.find({
      relations: ['manager', 'members'],
    });
  }

  async getTeamDetail(teamId: number) {
    const team: Team | null = await this.teamsRepository.findOne({
      where: { id: teamId },
      relations: ['manager', 'members', 'members.tasks'],
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const manager: User = team.manager;
    const members: User[] = team.members;

    return {
      id: team.id,
      name: team.name,
      manager: {
        id: manager.id,
        firstName: manager.firstName,
        lastName: manager.lastName,
      },
      members: members.map((member: User) => ({
        user: {
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
        },
        tasks: member.tasks,
      })),
    };
  }
}
