
# خداحافظ onSuccess در useQuery (React Query v5)
<img width="100%"  alt="image" src="https://github.com/user-attachments/assets/a550ef8b-8b33-442d-849e-e379c264e1a5" />


## مقدمه  
در نسخه ۵ کتابخانه‌ی **React Query**، متد `onSuccess` از `useQuery` حذف شد.  
دلیل این تغییر جلوگیری از قاطی شدن منطق UI با منطق API و کش بود (**Violation of Separation of Concerns**).  



## مشکل onSuccess  
- قاطی شدن منطق UI با API و کش  
- اجرا نشدن در بعضی شرایط (مثل وقتی داده از کش می‌آید و `staleTime` فعال است)  
- اجرا شدن چندباره ناخواسته وقتی یک کوئری در چند کامپوننت استفاده شود  
- نوتیفیکیشن‌ها چند بار پشت‌سرهم نمایش داده می‌شوند  
- سخت شدن تست و نگهداری کد  
- ایجاد درخواست‌های اضافی یا side-effectهای تکراری  
- تجربه کاربری بد و دیباگ سخت‌تر  



## پیشنهاد تیم React Query  
تیم React Query توصیه می‌کند از **Service Layer Pattern** استفاده کنید و لایه‌ها را از هم جدا نگه دارید:  

1. **Service Layer** → فقط فراخوانی شبکه و شکل‌دهی داده  
2. **API Hook Layer** → فقط کش و state با `useQuery` (بدون side effectهای UI)  
3. **Page Hook Layer** → منطق صفحه مثل toast، redirect یا chain call  
4. **UI Layer** → فقط نمایش داده  



## نمونه کد  

### Service Layer  
```ts
export async function fetchUsers() {
  const res = await fetch('/api/users');
  return res.json();
}
```

### API Hook Layer  
```ts
import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from './service';

export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: fetchUsers });
}
```

### Page Hook Layer  
```ts
import { useEffect } from 'react';
import { useUsers } from './useUsers';
import { toast } from 'react-hot-toast';

export function useUsersPage() {
  const q = useUsers();

  useEffect(() => {
    if (q.isSuccess) toast('Users loaded!');
  }, [q.isSuccess]);

  return q;
}
```

### UI Layer  
```tsx
import { useUsersPage } from './useUsersPage';

export function UsersPage() {
  const { data, isLoading } = useUsersPage();

  if (isLoading) return <>Loading...</>;
  return <ul>{data.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```



## مشکل مخفی در isSuccess  
اگر یک کاستوم‌هوک بسازید که در یک صفحه چند بار استفاده می‌شود، هر بار `isSuccess` می‌تواند افکت را دوباره اجرا کند.  
🔑 راه‌حل: استفاده از یک مارکر در کش React Query.  



## جلوگیری از افکت‌های تکراری  

```ts
// useOnSuccessOnce.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const markKey = (id: string) => ['__once__', id];

export function useOnSuccessOnce({
  id,
  isSuccess,
  updatedAt,
  fn,
}: {
  id: string;
  isSuccess: boolean;
  updatedAt: number;
  fn?: () => void;
}) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!isSuccess || !updatedAt || !fn) return;
    const last = qc.getQueryData<number>(markKey(id));
    if (last === updatedAt) return; // قبلاً اجرا شده
    qc.setQueryData(markKey(id), updatedAt);
    fn();
  }, [id, isSuccess, updatedAt, fn, qc]);
}
```



## نحوه استفاده  

```ts
// useCustomHook.ts
import { useQuery } from '@tanstack/react-query';
import { useOnSuccessOnce } from './useOnSuccessOnce';
import { toast } from 'react-hot-toast';

async function fetchUsers() {
  const res = await fetch('/api/users');
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export function useCustomHook() {
  const q = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  useOnSuccessOnce({
    id: 'users',
    isSuccess: q.isSuccess,
    updatedAt: q.dataUpdatedAt,
    fn: () => toast('Users loaded!'),
  });

  return q;
}
```



## جمع‌بندی  
- `onSuccess` در نسخه‌ی ۵ React Query حذف شد.  
- به‌جای آن منطق را در لایه‌های جدا (Service, API Hook, Page Hook, UI) پیاده‌سازی کنید.  
- برای جلوگیری از افکت‌های تکراری، از **مارکر کش** یا هوک کمکی مثل `useOnSuccessOnce` استفاده کنید.  



## منابع و کدها  

- **React Query v5 – Migration Guide**  
  https://tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5  

- **React Query v5 – useQuery API**  
  https://tanstack.com/query/v5/docs/framework/react/reference/useQuery  

- **GitHub Discussion: Why onSuccess/onError were removed**  
  https://github.com/TanStack/query/discussions/5175  

