# API Endpoint Audit - POST vs PATCH Consistency

## Overview
This document audits all API endpoints to ensure consistency between creation (POST) and update (PATCH/PUT) operations.

## Endpoint Analysis

### Projects
- ✅ **POST /api/projects** - Create new project
- ✅ **PATCH /api/projects/:id** - Update existing project
- ✅ **PUT /api/projects/:id** - Replace existing project
- **Status**: Consistent - All fields available in POST are updatable via PATCH

### Campaigns
- ✅ **POST /api/campaigns** - Create new campaign
- ✅ **PATCH /api/campaigns/:id** - Update existing campaign
- ✅ **PUT /api/campaigns/:id** - Replace existing campaign
- **Status**: Consistent - All fields available in POST are updatable via PATCH

### Campaign Groups
- ✅ **POST /api/campaign-groups** - Create new campaign group
- ✅ **PATCH /api/campaign-groups/:id** - Update existing campaign group
- **Status**: Consistent - All fields available in POST are updatable via PATCH

### Advertisers
- ✅ **POST /api/advertisers** - Create new advertiser
- ✅ **PATCH /api/advertisers/:id** - Update existing advertiser
- **Status**: Consistent - All fields available in POST are updatable via PATCH

### Keywords
- ✅ **POST /api/keywords** - Create new keyword
- ✅ **PATCH /api/keywords/:id** - Update existing keyword
- **Status**: Consistent - All fields available in POST are updatable via PATCH

### Traffic Sources
- ✅ **POST /api/traffic-sources** - Create new traffic source
- ✅ **PATCH /api/traffic-sources/:id** - Update existing traffic source
- **Status**: Consistent - All fields available in POST are updatable via PATCH

## Summary
✅ **All endpoints are consistent** - Every entity that can be created via POST can be fully updated via PATCH with the same field set.

## Recent Additions
- Added missing PATCH routes for campaigns and campaign groups
- Updated storage interface to support null projectId for getting all campaigns
- All status updates now use PATCH endpoints with proper optimistic updates

## Notes
- All PATCH endpoints use partial validation (insertSchema.partial())
- Optimistic updates are implemented for better UX
- Error handling includes rollback on API failure
- Status field standardized across all entities: draft, active, paused