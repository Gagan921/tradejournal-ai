import { Model, Document, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import { IBaseEntity, PaginationParams, PaginatedResult } from '../interfaces';

/**
 * Generic base repository for CRUD operations
 */
export abstract class BaseRepository<T extends IBaseEntity> {
  constructor(protected readonly model: Model<T & Document>) {}

  /**
   * Find all documents
   */
  async findAll(filter: FilterQuery<T> = {}): Promise<T[]> {
    return this.model.find(filter).lean().exec() as Promise<T[]>;
  }

  /**
   * Find by ID
   */
  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).lean().exec() as Promise<T | null>;
  }

  /**
   * Find one document
   */
  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return this.model.findOne(filter).lean().exec() as Promise<T | null>;
  }

  /**
   * Create new document
   */
  async create(data: Partial<T>): Promise<T> {
    const document = new this.model(data);
    const saved = await document.save();
    return saved.toObject() as T;
  }

  /**
   * Update document by ID
   */
  async updateById(id: string, data: UpdateQuery<T>): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .lean()
      .exec() as Promise<T | null>;
  }

  /**
   * Update one document
   */
  async updateOne(filter: FilterQuery<T>, data: UpdateQuery<T>): Promise<T | null> {
    return this.model
      .findOneAndUpdate(filter, data, { new: true, runValidators: true })
      .lean()
      .exec() as Promise<T | null>;
  }

  /**
   * Update many documents
   */
  async updateMany(filter: FilterQuery<T>, data: UpdateQuery<T>): Promise<number> {
    const result = await this.model.updateMany(filter, data).exec();
    return result.modifiedCount;
  }

  /**
   * Delete by ID
   */
  async deleteById(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  }

  /**
   * Delete one document
   */
  async deleteOne(filter: FilterQuery<T>): Promise<boolean> {
    const result = await this.model.findOneAndDelete(filter).exec();
    return result !== null;
  }

  /**
   * Delete many documents
   */
  async deleteMany(filter: FilterQuery<T>): Promise<number> {
    const result = await this.model.deleteMany(filter).exec();
    return result.deletedCount || 0;
  }

  /**
   * Count documents
   */
  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  /**
   * Check if document exists
   */
  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const count = await this.model.countDocuments(filter).exec();
    return count > 0;
  }

  /**
   * Find with pagination
   */
  async findWithPagination(
    filter: FilterQuery<T>,
    pagination: PaginationParams,
    sort: Record<string, 1 | -1> = { createdAt: -1 }
  ): Promise<PaginatedResult<T>> {
    const page = pagination.page || 1;
    const limit = Math.min(pagination.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model.find(filter).sort(sort).skip(skip).limit(limit).lean().exec() as Promise<T[]>,
      this.model.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Aggregate pipeline
   */
  async aggregate(pipeline: any[]): Promise<any[]> {
    return this.model.aggregate(pipeline).exec();
  }

  /**
   * Distinct values
   */
  async distinct(field: keyof T, filter: FilterQuery<T> = {}): Promise<any[]> {
    return this.model.distinct(field as string, filter).exec();
  }
}
