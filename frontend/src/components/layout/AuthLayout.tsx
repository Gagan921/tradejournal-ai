import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center bg-slate-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white text-lg font-bold leading-none shadow-sm">
            T
          </div>
          <h1 className="mt-3 text-xl font-bold tracking-tight text-slate-900">
            TradeMind
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            AI-Powered Trading Journal
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
