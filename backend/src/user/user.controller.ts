import { Controller, Post, Body } from "@nestjs/common"
import { UserService, SelectAssistent } from "./user.service"
@Controller("api/user")
export class UserController {
    constructor(private userService: UserService) { }


    @Post("get")
    async getUser(@Body() body: { identifier: string }) {
        const { identifier } = body
        return this.userService.getUser(identifier)
    }

    @Post("update")
    async updateUser(@Body() body: { userId: string, name?: string, bio?: string }) {
        const { userId, bio, name } = body
        return this.userService.updateUser(userId, name, bio)
    }

    @Post("assistant")
    async selectAssistant(@Body() body: { userId: string, assistantmode: SelectAssistent }) {
        const { assistantmode, userId } = body
        console.log(assistantmode)
        return this.userService.selectAssistant(userId, assistantmode)
    }

}

