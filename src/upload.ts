// This is used for getting user input.
import { createInterface } from 'readline/promises'

import {
	S3Client,
	PutObjectCommand,
	CreateBucketCommand,
	DeleteObjectCommand,
	DeleteBucketCommand,
	paginateListObjectsV2,
	GetObjectCommand,
	ListBucketsCommand,
	BucketAlreadyOwnedByYou,
	ListObjectsV2Command,
} from '@aws-sdk/client-s3'

// A region and credentials can be declared explicitly. For example
// `new S3Client({ region: 'us-east-1', credentials: {...} })` would
//initialize the client with those settings. However, the SDK will
// use your local configuration and credentials if those properties
// are not defined here.
const s3Client = new S3Client({})

export const getS3Client = () => {
	return s3Client
}

export const createBucket = async (bucketName: string) => {
	// Create an Amazon S3 bucket. The epoch timestamp is appended
	// to the name to make it unique.
	try {
		const bucket = await s3Client.send(
			new CreateBucketCommand({
				Bucket: bucketName,
			}),
		)

		return bucket
	} catch (err) {
		if (err instanceof BucketAlreadyOwnedByYou) {
			const buckets = await s3Client.send(new ListBucketsCommand())
			const bucket = buckets.Buckets?.find(
				({ Name }) => Name === bucketName,
			)
			console.log({
				bucketName,
				bucketsNames: buckets.Buckets?.map(({ Name }) => Name),
			})
			if (bucket) {
				return bucket
			}
		}
		throw new Error(`Problem with s3 Bucket: ${err}`)
	}
}

export const sendDocument = async (
	bucketName: string,
	Key: string,
	Body: Buffer,
) => {
	// Put an object into an Amazon S3 bucket.
	await s3Client.send(
		new PutObjectCommand({
			Bucket: bucketName,
			Key,
			Body,
		}),
	)
}

export const listDocuments = async (bucketName: string) => {
	return await s3Client.send(
		new ListObjectsV2Command({
			Bucket: bucketName,
		}),
	)
}

export const getDocument = async (bucketName: string, Key: string) => {
	// Read the object.
	return await s3Client.send(
		new GetObjectCommand({
			Bucket: bucketName,
			Key,
		}),
	)
}

export const deleteBucket = async (bucketName: string) => {
	// Confirm resource deletion.
	const prompt = createInterface({
		input: process.stdin,
		output: process.stdout,
	})

	const result = await prompt.question('Empty and delete bucket? (y/n) ')
	prompt.close()

	if (result === 'y') {
		// Create an async iterator over lists of objects in a bucket.
		const paginator = paginateListObjectsV2(
			{ client: s3Client },
			{ Bucket: bucketName },
		)
		for await (const page of paginator) {
			const objects = page.Contents
			if (objects) {
				// For every object in each page, delete it.
				for (const object of objects) {
					await s3Client.send(
						new DeleteObjectCommand({
							Bucket: bucketName,
							Key: object.Key,
						}),
					)
				}
			}
		}

		// Once all the objects are gone, the bucket can be deleted.
		await s3Client.send(new DeleteBucketCommand({ Bucket: bucketName }))
	}
}
