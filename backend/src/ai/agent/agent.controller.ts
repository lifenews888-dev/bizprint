import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common'
import { AgentService } from './agent.service'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { AGENT_TOOLS } from './agent-tools'

@Controller('ai/agent')
export class AgentController {
  constructor(private agentService: AgentService) {}

  /**
   * POST /ai/agent/chat
   * Main chat endpoint — authenticated users send messages, get AI responses
   */
  @Post('chat')
  @UseGuards(JwtAuthGuard)
  async chat(
    @Request() req: any,
    @Body() body: { message: string; conversationHistory?: any[] },
  ) {
    const { message, conversationHistory } = body
    const userId = req.user.sub || req.user.id
    const userRole = req.user.role || 'customer'

    return this.agentService.chat({
      message,
      userId,
      userRole,
      conversationHistory,
    })
  }

  /**
   * GET /ai/agent/tools
   * List available tools (for frontend display)
   */
  @Get('tools')
  getTools() {
    return AGENT_TOOLS.map(t => ({
      name: t.name,
      description: t.description,
    }))
  }
}
