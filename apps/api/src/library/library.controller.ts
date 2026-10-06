import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { AuthUser } from '../common/auth-user';
import { CurrentUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Permissions } from '../common/permissions';
import { PermissionsGuard, RequirePermissions } from '../common/permissions.guard';
import { requireStudent } from '../common/student-access';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('library')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('library')
export class LibraryController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('books')
  @RequirePermissions(Permissions.LibraryRead)
  @ApiQuery({ name: 'q', required: false })
  books(@Query('q') q?: string) {
    const query = (q ?? '').trim();
    const where: Prisma.LibraryBookWhereInput | undefined = query
      ? {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { author: { contains: query, mode: 'insensitive' } },
            { isbn: { contains: query, mode: 'insensitive' } },
          ],
        }
      : undefined;
    return this.prisma.libraryBook.findMany({
      where,
      orderBy: { title: 'asc' },
      take: 50,
      select: { id: true, isbn: true, title: true, author: true, copies: true, available: true },
    });
  }

  @Get('loans')
  @RequirePermissions(Permissions.LibraryLoansReadOwn)
  loans(@CurrentUser() user: AuthUser) {
    const studentId = requireStudent(user);
    return this.prisma.libraryLoan.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        dueAt: true,
        createdAt: true,
        book: { select: { id: true, title: true, author: true, isbn: true } },
      },
    });
  }
}
