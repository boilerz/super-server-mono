import * as _ from 'lodash';
import * as crypto from 'crypto';
import { prop } from '@typegoose/typegoose';

import User from './User';
import AuthProvider from '../../enum/AuthProvider';
import { EntityModel } from '../Entity';

function emailValidationCodeGenerator(): string {
  return crypto.randomBytes(20).toString('hex');
}

export class UserSchema extends User {
  @prop({ required: true, default: AuthProvider.LOCAL, enum: AuthProvider })
  provider: string;

  @prop({ default: true })
  isActive: boolean;

  @prop({ default: emailValidationCodeGenerator })
  emailValidationCode: string;

  @prop({
    required: true,
    validate: {
      validator: _.negate(_.isEmpty),
      message: 'user:validator:passwordBlank',
    },
  })
  hashedPassword?: string;

  @prop({ required: true })
  salt?: string;

  set password(password: string) {
    this.salt = this.makeSalt();
    this.hashedPassword = this.encryptPassword(password);
  }

  authenticate(plainTextPassword: string): boolean {
    return this.encryptPassword(plainTextPassword) === this.hashedPassword;
  }

  makeSalt(): string {
    return crypto.randomBytes(16).toString('base64');
  }

  encryptPassword(password: string): string {
    const salt: Buffer = Buffer.from(this.salt as string, 'base64');
    return crypto
      .pbkdf2Sync(password, salt, 10000, 64, 'sha1')
      .toString('base64');
  }
}

const UserModel: EntityModel<UserSchema> = UserSchema.getModel();

export default UserModel;
