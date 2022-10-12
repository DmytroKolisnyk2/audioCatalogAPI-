import type { UserRepository } from '@repositories';
import type { Request } from 'express';
import { generate } from '@utils';
import { UserExistError, UserNotExistError, InValidPassword } from 'error';
import type { UserDto, IAuth } from '@types';

export class AuthService {
  private _userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this._userRepository = userRepository;
  }

  register = async (req: Request): Promise<UserDto> => {
    const { username, password } = req.body;
    const existingUser = await this._userRepository.getByUsername(username);
    if (existingUser) {
      throw new UserExistError(req.t);
    }
    const hashedPassword = await this._userRepository.hashPassword(password);

    const newUser = await this._userRepository.createUser(
      req.body,
      hashedPassword,
    );
    const payload = {
      username: newUser.username,
      _id: newUser._id,
    };
    const token = generate(payload);

    return {
      user: newUser,
      token,
    };
  };

  login = async (req: Request): Promise<UserDto> => {
    const { username, password } = req.body;
    const user = await this._userRepository.getByUsername(username);
    if (!user) {
      throw new UserNotExistError(req.t);
    }
    const validPassword = await this._userRepository.verifyPassword(
      password,
      user.password,
    );

    if (!validPassword) {
      throw new InValidPassword(req.t);
    }
    const payload = {
      username: user.username,
      _id: user._id,
    };
    const token = generate(payload);

    return {
      user: user,
      token,
    };
  };

  current = async (req: IAuth): Promise<UserDto> => {
    const payload = {
      username: req.user.username,
      _id: req.user._id,
    };
    const token = generate(payload);

    return {
      user: req.user,
      token,
    };
  };
}
