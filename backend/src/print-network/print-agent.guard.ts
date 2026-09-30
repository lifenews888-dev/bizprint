import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { PrintNetworkService } from './print-network.service'

/** Цехийн агентыг `X-Agent-Token` толгойгоор таньж req.printAgent-д хадгална */
@Injectable()
export class PrintAgentGuard implements CanActivate {
  constructor(private readonly svc: PrintNetworkService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest()
    const token = String(req.headers['x-agent-token'] ?? '')
    const agent = await this.svc.authenticateAgent(token)
    if (!agent) throw new UnauthorizedException('Агентын токен буруу')
    req.printAgent = agent
    return true
  }
}
