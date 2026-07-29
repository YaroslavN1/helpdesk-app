import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createUserSchema } from '@helpdesk/core'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CircleAlert } from 'lucide-react'
import { useCreateUser, useUpdateUser } from '@/hooks/useUsers'
import { getErrorMessage } from '@/lib/api-client'
import { type User } from '@/types/user'

type FormValues = { name: string; email: string; password: string }
export type FormState = { mode: 'create'; user: null } | { mode: 'edit'; user: User }

interface Props {
  form: FormState | null
  onOpenChange: (open: boolean) => void
}

const editUserSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters'),
  email: z.email('Valid email is required'),
  password: z.union([
    z.literal(''),
    z.string().trim().min(8, 'Password must be at least 8 characters'),
  ]),
})

export function UserForm({ form, onOpenChange }: Props) {
  const isEditing = form?.mode === 'edit'
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(isEditing ? editUserSchema : createUserSchema),
  })

  useEffect(() => {
    if (form !== null) {
      reset({
        name: form.user?.name ?? '',
        email: form.user?.email ?? '',
        password: '',
      })
    }
  }, [form, reset])

  async function onSubmit(data: FormValues) {
    clearErrors('root')

    try {
      if (form?.mode === 'edit') {
        await updateUser.mutateAsync({
          id: form.user.id,
          name: data.name,
          email: data.email,
          ...(data.password ? { password: data.password } : {}),
        })
      } else {
        await createUser.mutateAsync({
          name: data.name,
          email: data.email,
          password: data.password,
        })
      }
      onOpenChange(false)
    } catch (err) {
      setError('root', {
        message:
          getErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} user`) ?? undefined,
      })
    }
  }

  return (
    <Dialog open={form !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit user' : 'Create user'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="user-name">Name</Label>
              <Input
                id="user-name"
                placeholder="Jane Smith"
                autoComplete="off"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="jane@example.com"
                autoComplete="off"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="user-password">
                Password
                {isEditing && (
                  <span className="text-muted-foreground font-normal">
                    {' '}
                    (leave blank to keep current)
                  </span>
                )}
              </Label>
              <Input
                id="user-password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {errors.root?.message && (
              <p className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2">
                <CircleAlert className="size-4 shrink-0" />
                {errors.root.message}
              </p>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEditing
                  ? 'Saving…'
                  : 'Creating…'
                : isEditing
                  ? 'Save changes'
                  : 'Create user'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
