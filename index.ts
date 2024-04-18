import express, { Express, Request, Response } from 'express'
import { engine } from 'express-handlebars'
import 'dotenv/config'
import {
	createBucket,
	getS3Client,
	listDocuments,
	sendDocument,
} from './src/upload'
import { ListBucketsCommand } from '@aws-sdk/client-s3'
import { default as fileUpload } from 'express-fileupload'

const app: Express = express()

app.engine('handlebars', engine())
app.set('view engine', 'handlebars')
app.set('views', './src/views')
app.use(fileUpload())

const bucketName = `my-document-bucket-test`
createBucket(bucketName)

app.get('/', async (_: Request, res: Response) => {
	res.render('index', { test: 'HEY' })
})

app.post('/send', async (req: Request, res: Response) => {
	const file = req.files?.fileToUpload
	if (!file || Array.isArray(file))
		throw new Error('No file sent or corrupted')
	// Post a document to s3
	sendDocument(bucketName, file.name, file.data)

	res.redirect('/list')
})

app.get('/list', async (_: Request, res: Response) => {
	const { Contents } = await listDocuments(bucketName)
	res.render('list', { items: Contents?.map(({ Key }) => ({ Key })) })
})

app.get('/list-bucket', async (_: Request, res: Response) => {
	const client = getS3Client()
	const { Buckets } = await client.send(new ListBucketsCommand({}))

	if (!Buckets) return res.send('There is no bucket')

	res.send(`Buckets: ${Buckets.map(bucket => bucket.Name).join('\n')}`)
})

app.get('/document/:id', async (req: Request, res: Response) => {
	const { id } = req.params
	// Download a document from s3
	res.send(`document ${id}`)
})

const port = process.env.PORT

app.listen(port, () => {
	console.log(
		`[server]: AWS Application Server is running at http://localhost:${port}`,
	)
})
