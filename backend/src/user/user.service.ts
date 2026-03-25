import { Injectable, UnauthorizedException } from "@nestjs/common"
import { PrismaService } from "../prisma/primsa.service"
@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    async getUser(identifier) {
        try {
            if (!identifier) throw new UnauthorizedException("emial or username is required")
            const user = await this.prisma.user.findFirst({
                where: {
                    OR: [
                        { email: identifier },
                        { username: identifier }
                    ]
                }
            })
            if (!user) throw new UnauthorizedException('user not found')
            return { message: "user found", statusbar: 200, user, sucess: true }


        } catch (e) {
            return { message: "internal server error", status: 500, sucess: false }
        }
    }

    async updateUser(identifier){
   
    }

}