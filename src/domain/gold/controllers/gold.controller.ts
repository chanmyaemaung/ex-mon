import { Controller, Get } from "@nestjs/common";
import { GoldService } from "../services/gold.service";

@Controller("v1/gold")
export class GoldController {
  constructor(private readonly goldService: GoldService) {}

  @Get("getLatest")
  async getLatest() {
    return this.goldService.getLatest();
  }
}