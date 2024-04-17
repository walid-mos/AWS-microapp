import express, { Express, Request, Response } from 'express'
import 'dotenv/config'
import { createBucket, getS3Client } from './src/upload'
import { ListBucketsCommand } from '@aws-sdk/client-s3'

const app: Express = express()

const bucketName = `test-bucket-${Date.now()}`
createBucket(bucketName)
createBucket(bucketName + 2)

app.get('/', async (_: Request, res: Response) => {
	const command = new ListBucketsCommand({})

	const client = getS3Client()
	const { Buckets } = await client.send(command)
	if (!Buckets) return 'no buckets'
	console.log('Buckets: ')
	console.log(Buckets.map(bucket => bucket.Name).join('\n'))
	res.send('Hello World!')
})

const port = process.env.PORT

app.listen(port, () => {
	console.log(
		`[server]: AWS Application Server is running at http://localhost:${port}`,
	)
})
