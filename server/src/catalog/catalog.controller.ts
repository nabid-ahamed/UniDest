import { Controller, Get, Inject, Param, ParseIntPipe, Query } from '@nestjs/common'
import { CatalogService, type CourseFilters } from './catalog.service'

/**
 * Read-only in Phase 2. Catalog editing (src/features/courseManagement) stays
 * on mocks for now — it is not part of the core funnel.
 *
 * No @RequirePermission: every signed-in user needs the catalog to work with
 * leads and students. The global JwtAuthGuard still requires a valid token.
 */
@Controller()
export class CatalogController {
  constructor(@Inject(CatalogService) private readonly catalog: CatalogService) {}

  @Get('countries')
  countries() {
    return this.catalog.countries()
  }

  @Get('universities')
  universities(@Query('country') country?: string) {
    return this.catalog.universities(country)
  }

  @Get('course-categories')
  categories() {
    return this.catalog.categories()
  }

  @Get('courses')
  courses(@Query() filters: CourseFilters) {
    return this.catalog.courses(filters)
  }

  @Get('courses/:id')
  course(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.course(id)
  }
}
