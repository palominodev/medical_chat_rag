'use client'

import React, { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const AuthPage = () => {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const { signIn, loading, error } = useAuth()

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault()
		await signIn(email, password)
	}

	return (
		<div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Bienvenido</CardTitle>
					<CardDescription>Inicia sesión para acceder al asistente médico</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleLogin} className="space-y-4">
						<div className="space-y-2">
							<label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
							<Input
								id="email"
								type="email"
								placeholder="doctor@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>
						<div className="space-y-2">
							<label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Contraseña</label>
							<Input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
						</div>
						{error && (
							<div className="text-sm text-red-500 font-medium">
								{error}
							</div>
						)}
						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}

export default AuthPage