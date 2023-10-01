import { RegistrationRequest as RegistrationRequest } from '~~/types/IRegistration';
import { H3Event } from 'h3';
import { getSanitizedUserBySessionToken } from './sessionService';
import { isString } from '@vueuse/core';
import { IUserSanitized } from '~~/types/IUser';
import { validate } from './validator';
import { validateRegistration } from '~/server/app/services/validator'
import { User } from '@prisma/client';
import {getUnverifiedUsers} from '~/server/database/repositories/userRepository'
import { sendReminderVerificationEmail } from '~~/server/app/email/verifyEmail';

export async function validateUser(data: RegistrationRequest) {

    const errors = await validate(data, validateRegistration)

    if (errors.size > 0) {

        return { hasErrors: true, errors }
    }

    return { hasErrors: false }
}

export function sanitizeUserForFrontend(user: User): IUserSanitized {

    const userSanitized = {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email
    }

    return userSanitized as IUserSanitized
}

export async function authCheck(event: H3Event): Promise<boolean> {

    const authToken = getCookie(event, 'auth_token')
    const hasAuthToken = isString(authToken)

    if (!hasAuthToken) {
        return false
    }

    const user = await getSanitizedUserBySessionToken(authToken)

    if (user?.id) {
        return true
    }

    return false
}

export async function remindUnverifiedUsers() {
    const users =  await getUnverifiedUsers()

    console.log('Found ', users.length, ' unverified users')
    users.forEach((user: User) => { 
        // Send email to user
        console.log('Sending email to user: ', user.username, ' with email: ', user.email, ' and id: ', user.id, '')
        if (user.email && user.id)
        sendReminderVerificationEmail(user.email, user.id)
    })
}
