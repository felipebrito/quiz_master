import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/participants - Listar todos os participantes com status 'waiting'
export async function GET(request: NextRequest) {
  try {
    const participants = await prisma.participant.findMany({
      where: {
        status: 'waiting'
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: participants,
      count: participants.length
    }, { status: 200 })

  } catch (error) {
    console.error('Erro ao buscar participantes:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

// POST /api/participants - Criar novo participante
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validação básica dos dados obrigatórios
    if (!body.name || !body.city || !body.state) {
      return NextResponse.json({
        success: false,
        error: 'Nome, cidade e estado são obrigatórios'
      }, { status: 400 })
    }

    // Validação de tamanho dos campos
    if (body.name.length < 2 || body.name.length > 100) {
      return NextResponse.json({
        success: false,
        error: 'Nome deve ter entre 2 e 100 caracteres'
      }, { status: 400 })
    }

    if (body.city.length < 2 || body.city.length > 50) {
      return NextResponse.json({
        success: false,
        error: 'Cidade deve ter entre 2 e 50 caracteres'
      }, { status: 400 })
    }

    if (body.state.length !== 2) {
      return NextResponse.json({
        success: false,
        error: 'Estado deve ter exatamente 2 caracteres (UF)'
      }, { status: 400 })
    }

    const participant = await prisma.participant.create({
      data: {
        name: body.name.trim(),
        city: body.city.trim(),
        state: body.state.trim().toUpperCase(),
        photo_url: body.photo_url?.trim() || null,
        status: 'waiting'
      }
    })

    return NextResponse.json({
      success: true,
      data: participant
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar participante:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
