import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/primsa.service";
import { RedisService } from "../redis/redis.service";
export enum SelectAssistent {
    socratic = "socratic",
    direct = "direct",
    creative = "creative",
    evaluator = "evaluator",
}

@Injectable()
export class UserService {
    constructor(
        private prisma: PrismaService,
        private redis: RedisService
    ) { }


    async getUser(identifier: string) {
        try {
            if (!identifier)
                throw new UnauthorizedException("email or username is required");

            const cacheKey = `user:${identifier}`;

            let user = await this.redis.get<any>(cacheKey);

            if (!user) {

                user = await this.prisma.user.findFirst({
                    where: {
                        OR: [{ email: identifier }, { username: identifier }],
                    },
                });

                if (!user) throw new UnauthorizedException("user not found");


                await this.redis.set(cacheKey, user, 300);
            }

            return { message: "user found", status: 200, user, success: true };
        } catch (e) {
            return {
                message: "internal server error",
                status: 500,
                success: false,
            };
        }
    }

    async updateUser(userId: string, name?: string, bio?: string) {
        const data: any = {};

        if (name !== undefined) data.name = name;
        if (bio !== undefined) data.bio = bio;

        const user = await this.prisma.user.update({
            where: { id: userId },
            data,
        });

        await this.redis.del(`user:${user.email}`);
        await this.redis.del(`user:${user.username}`);

        return { message: "updated", status: 200, user };
    }


    async selectAssistant(userId: string, assistant: SelectAssistent) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { assistant },
        });

        await this.redis.del(`user:${user.email}`);
        await this.redis.del(`user:${user.username}`);

        return {
            message: "Assistant updated",
            status: 200,
            assistant,
        };
    }

    getAssistantPrompt(assistant: SelectAssistent) {
        switch (assistant) {
            case SelectAssistent.socratic:
                return `
You are a Socratic teacher.
- Ask questions instead of giving direct answers
- Guide the student step-by-step
- Encourage thinking
`;

            case SelectAssistent.direct:
                return `
You are a direct and concise assistant.
- Give clear answers quickly
- Avoid unnecessary explanation
`;

            case SelectAssistent.creative:
                return `
You are a creative and engaging assistant.
- Use storytelling, analogies, and examples
- Make learning fun
`;

            case SelectAssistent.evaluator:
                return `
You are an evaluator.
- Analyze answers
- Give feedback and scoring
- Suggest improvements
`;

            default:
                return `You are a helpful assistant.`;
        }
    }
}