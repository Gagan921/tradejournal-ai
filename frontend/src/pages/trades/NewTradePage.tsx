import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { PlusIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { tradesApi } from '../../services/api';
import toast from 'react-hot-toast';

const tradeLegSchema = z.object({
  price: z.number().positive('Price must be positive'),
  quantity: z.number().positive('Quantity must be positive'),
  date: z.string(),
});

const newTradeSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').toUpperCase(),
  direction: z.enum(['LONG', 'SHORT']),
  entries: z.array(tradeLegSchema).min(1, 'At least one entry is required'),
  exits: z.array(tradeLegSchema).optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
});

type NewTradeForm = z.infer<typeof newTradeSchema>;

export const NewTradePage = () => {
  const navigate = useNavigate();
  
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NewTradeForm>({
    resolver: zodResolver(newTradeSchema),
    defaultValues: {
      direction: 'LONG',
      entries: [{ price: 0, quantity: 0, date: new Date().toISOString().slice(0, 16) }],
      exits: [],
    },
  });

  const {
    fields: entryFields,
    append: appendEntry,
    remove: removeEntry,
  } = useFieldArray({
    control,
    name: 'entries',
  });

  const {
    fields: exitFields,
    append: appendExit,
    remove: removeExit,
  } = useFieldArray({
    control,
    name: 'exits',
  });

  const createTrade = useMutation({
    mutationFn: (data: any) => tradesApi.create(data),
    onSuccess: () => {
      toast.success('Trade created successfully!');
      navigate('/trades');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create trade');
    },
  });

  const onSubmit = (data: NewTradeForm) => {
    const payload = {
      ...data,
      tags: data.tags ? data.tags.split(',').map((t) => t.trim()) : [],
    };
    createTrade.mutate(payload);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Trade</h1>
          <p className="text-gray-600">Log a new trade entry.</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
        {/* Basic Info */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Trade Details</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Symbol</label>
                <input
                  {...register('symbol')}
                  type="text"
                  placeholder="AAPL"
                  className="input uppercase"
                />
                {errors.symbol && (
                  <p className="mt-1 text-sm text-danger-600">{errors.symbol.message}</p>
                )}
              </div>
              <div>
                <label className="label">Direction</label>
                <select {...register('direction')} className="input">
                  <option value="LONG">Long</option>
                  <option value="SHORT">Short</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Tags (comma separated)</label>
              <input
                {...register('tags')}
                type="text"
                placeholder="swing, breakout, earnings"
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Entries */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Entries</h2>
            <button
              type="button"
              onClick={() =>
                appendEntry({ price: 0, quantity: 0, date: new Date().toISOString().slice(0, 16) })
              }
              className="btn-secondary text-sm"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Entry
            </button>
          </div>
          <div className="card-body space-y-4">
            {entryFields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="label">Price</label>
                  <input
                    {...register(`entries.${index}.price`, { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    placeholder="150.00"
                    className="input"
                  />
                </div>
                <div className="flex-1">
                  <label className="label">Quantity</label>
                  <input
                    {...register(`entries.${index}.quantity`, { valueAsNumber: true })}
                    type="number"
                    placeholder="100"
                    className="input"
                  />
                </div>
                <div className="flex-1">
                  <label className="label">Date</label>
                  <input
                    {...register(`entries.${index}.date`)}
                    type="datetime-local"
                    className="input"
                  />
                </div>
                {entryFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEntry(index)}
                    className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Exits */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Exits (Optional)</h2>
            <button
              type="button"
              onClick={() =>
                appendExit({ price: 0, quantity: 0, date: new Date().toISOString().slice(0, 16) })
              }
              className="btn-secondary text-sm"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Exit
            </button>
          </div>
          <div className="card-body space-y-4">
            {exitFields.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No exits yet. You can add exits later.
              </p>
            ) : (
              exitFields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="label">Price</label>
                    <input
                      {...register(`exits.${index}.price`, { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      placeholder="155.00"
                      className="input"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="label">Quantity</label>
                    <input
                      {...register(`exits.${index}.quantity`, { valueAsNumber: true })}
                      type="number"
                      placeholder="100"
                      className="input"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="label">Date</label>
                    <input
                      {...register(`exits.${index}.date`)}
                      type="datetime-local"
                      className="input"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExit(index)}
                    className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={createTrade.isPending}
            className="btn-primary px-8 disabled:opacity-50"
          >
            {createTrade.isPending ? 'Creating...' : 'Create Trade'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-ghost"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
