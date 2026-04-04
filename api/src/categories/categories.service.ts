import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Category } from './category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepo: Repository<Category>,
  ) {}

  // Retorna categorías globales + las del usuario
  async findAll(userId: string): Promise<Category[]> {
    return this.categoriesRepo.find({
      where: [
        { userId: IsNull() },  // Globales
        { userId },             // Del usuario
      ],
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Category | null> {
    return this.categoriesRepo.findOne({ where: { id } });
  }

  async create(userId: string, data: { name: string; icon: string; color: string }): Promise<Category> {
    const category = this.categoriesRepo.create({ ...data, userId });
    return this.categoriesRepo.save(category);
  }
}
