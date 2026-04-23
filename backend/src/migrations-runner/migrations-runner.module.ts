import { Global, Module } from '@nestjs/common'
import { MigrationsRunnerService } from './migrations-runner.service'

/**
 * Registers MigrationsRunnerService globally so its OnApplicationBootstrap
 * hook always runs — no other module has to import it explicitly.
 */
@Global()
@Module({
  providers: [MigrationsRunnerService],
  exports: [MigrationsRunnerService],
})
export class MigrationsRunnerModule {}
