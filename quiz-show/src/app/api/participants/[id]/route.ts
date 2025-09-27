import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/participants/[id] - Buscar participante por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const participant = await prisma.participant.findUnique({
      where: { id }
    })

    if (!participant) {
      return NextResponse.json({
        success: false,
        error: 'Participante não encontrado'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: participant
    }, { status: 200 })

  } catch (error) {
    console.error('Erro ao buscar participante:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

// PUT /api/participants/[id] - Atualizar participante
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Verificar se o participante existe
    const existingParticipant = await prisma.participant.findUnique({
      where: { id }
    })

    if (!existingParticipant) {
      return NextResponse.json({
        success: false,
        error: 'Participante não encontrado'
      }, { status: 404 })
    }

    // Verificar se é FormData (com foto) ou JSON
    const contentType = request.headers.get('content-type') || ''
    let body: any = {}

    if (contentType.includes('multipart/form-data')) {
      // FormData - com possível upload de foto
      const formData = await request.formData()
      body.name = formData.get('name') as string
      body.city = formData.get('city') as string
      body.state = formData.get('state') as string
      body.photo = formData.get('photo') as string
    } else {
      // JSON normal
      body = await request.json()
    }

    // Validação dos dados (se fornecidos)
    if (body.name && (body.name.length < 2 || body.name.length > 100)) {
      return NextResponse.json({
        success: false,
        error: 'Nome deve ter entre 2 e 100 caracteres'
      }, { status: 400 })
    }

    if (body.city && (body.city.length < 2 || body.city.length > 50)) {
      return NextResponse.json({
        success: false,
        error: 'Cidade deve ter entre 2 e 50 caracteres'
      }, { status: 400 })
    }

    if (body.state && body.state.length !== 2) {
      return NextResponse.json({
        success: false,
        error: 'Estado deve ter exatamente 2 caracteres (UF)'
      }, { status: 400 })
    }

    // Preparar dados para atualização (apenas campos fornecidos)
    const updateData: any = {}
    if (body.name) updateData.name = body.name.trim()
    if (body.city) updateData.city = body.city.trim()
    if (body.state) updateData.state = body.state.trim().toUpperCase()
    if (body.status) updateData.status = body.status

    // Processar foto se fornecida
    if (body.photo) {
      if (body.photo.startsWith('data:image')) {
        // Foto em base64 - salvar diretamente
        updateData.photo_url = body.photo
      } else if (body.photo_url !== undefined) {
        // URL da foto
        updateData.photo_url = body.photo_url?.trim() || null
      }
    }

    const updatedParticipant = await prisma.participant.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: updatedParticipant
    }, { status: 200 })

  } catch (error) {
    console.error('Erro ao atualizar participante:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

// DELETE /api/participants/[id] - Remover participante
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Verificar se o participante existe
    const existingParticipant = await prisma.participant.findUnique({
      where: { id }
    })

    if (!existingParticipant) {
      return NextResponse.json({
        success: false,
        error: 'Participante não encontrado'
      }, { status: 404 })
    }

    // Verificar se o participante está em algum jogo ativo
    const activeGame = await prisma.gameParticipant.findFirst({
      where: {
        participant_id: id,
        game: {
          status: 'active'
        }
      }
    })

    if (activeGame) {
      return NextResponse.json({
        success: false,
        error: 'Não é possível remover participante que está em jogo ativo'
      }, { status: 400 })
    }

    await prisma.participant.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Participante removido com sucesso'
    }, { status: 200 })

  } catch (error) {
    console.error('Erro ao remover participante:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
