import {Module} from "@nestjs/common"
import {ConfigModule} from "@nestjs/config"
import {EnvConfig} from "./env.config"

@Module({
    imports : [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: EnvConfig
        })
    ]
})


export class EnvModule {}