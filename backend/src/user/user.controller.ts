import {Controller,Post,Body} from "@nestjs/common"
import {UserService} from "./user.service"
@Controller("api/user")
export class UserController {
    constructor(private userService : UserService){}


    @Post("get")
    async getUser(@Body() body : {identifier:string}){
        const { identifier } = body
        return this.userService.getUser(identifier)
    }

}

