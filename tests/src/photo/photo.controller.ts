import { Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { PhotoService } from './photo.service.js';

@Controller('photo')
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

  @Get()
  findAll() {
    return this.photoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.photoService.findOne(id);
  }

  @Post()
  create() {
    return this.photoService.create();
  }
}
