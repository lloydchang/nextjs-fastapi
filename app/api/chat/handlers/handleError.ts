// File: app/api/chat/handlers/handleError.ts

import { NextResponse } from 'next/server';
import logger from '../utils/log';

export function handleError(error: any, status: number = 500, message: string = 'Internal Server Error') {
  logger.error(`Error: ${error.message}`);
  return NextResponse.json({ error: message }, { status });
}
