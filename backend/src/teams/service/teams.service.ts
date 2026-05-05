import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../entities/team.entity';
import { User } from '../../auth/entities/user.entity';

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

    team.members.push(user);
    return this.teamsRepository.save(team);
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
      user: {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
      },
      tasks: member.tasks,
    }));
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
