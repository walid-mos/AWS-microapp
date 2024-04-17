import express, { Express, Request, Response } from 'express'
import 'dotenv/config'

const app: Express = express()

app.get('/', (_: Request, res: Response) => {
	res.send('Hello World!')
})

const port = process.env.PORT

app.listen(port, () => {
	console.log(
		`[server]: AWS Application Server is running at http://localhost:${port}`,
	)
})
