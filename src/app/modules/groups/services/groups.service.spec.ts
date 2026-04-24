import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GroupsService } from './groups.service';
import { ConfigService } from '../../../common/services/config/config.service';
import { IPaginatedResponse } from '../../../common/types/IPaginatedResponse';
import { IGroup, IGroupCreate } from '../types/IGroup';
import { IGroupStatistics } from '../types/IGroupStatistics';
import { clearAllCaches } from '../../../common/decorators/cache';

describe('GroupsService', () => {
  let service: GroupsService;
  let httpMock: HttpTestingController;
  const API_URL = '/api/v1.1/';
  const mockConfig = { config: { apiUrl: API_URL } };

  beforeEach(() => {
    clearAllCaches();
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: ConfigService, useValue: mockConfig },
      ],
    });
    service = TestBed.inject(GroupsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getGroups', () => {
    const mockResponse: IPaginatedResponse<IGroup> = {
      data: [{ id: 1, name: 'Group A', description: 'First group', color: '#ff0000' }],
      count: 1,
    };

    it('should GET groups with default params', (done) => {
      service.getGroups().subscribe({
        next: (result) => {
          expect(result.data.length).toBe(1);
          expect(result.data[0].name).toBe('Group A');
          done();
        },
        error: done.fail,
      });
      const req = httpMock.expectOne(r => r.url === API_URL + 'groups');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('pageSize')).toBe('10');
      expect(req.request.params.get('filter')).toBe('');
      req.flush(mockResponse);
    });

    it('should add search to filter', (done) => {
      service.getGroups('alpha').subscribe({
        next: () => done(),
        error: done.fail,
      });
      const req = httpMock.expectOne(r => r.url === API_URL + 'groups');
      expect(req.request.params.get('filter')).toBe('name#=*alpha/i');
      req.flush(mockResponse);
    });

    it('should pass custom page and pageSize', (done) => {
      service.getGroups('', 2, 25).subscribe({
        next: () => done(),
        error: done.fail,
      });
      const req = httpMock.expectOne(r => r.url === API_URL + 'groups');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('pageSize')).toBe('25');
      req.flush(mockResponse);
    });
  });

  describe('getGroup', () => {
    it('should GET group by id', (done) => {
      const mockGroup: IGroup = { id: 5, name: 'Group B', description: 'Second group', color: '#00ff00' };
      service.getGroup(5).subscribe({
        next: (result) => {
          expect(result.name).toBe('Group B');
          expect(result.id).toBe(5);
          done();
        },
        error: done.fail,
      });
      const req = httpMock.expectOne(API_URL + 'groups/5');
      expect(req.request.method).toBe('GET');
      req.flush(mockGroup);
    });
  });

  describe('createGroup', () => {
    it('should POST new group', (done) => {
      const newGroup: IGroupCreate = { name: 'New Group', description: 'A new group', color: '#0000ff' };
      const created: IGroup = { id: 10, ...newGroup };
      service.createGroup(newGroup).subscribe({
        next: (result) => {
          expect(result.id).toBe(10);
          expect(result.name).toBe('New Group');
          done();
        },
        error: done.fail,
      });
      const req = httpMock.expectOne(API_URL + 'groups');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newGroup);
      req.flush(created);
    });
  });

  describe('updateGroup', () => {
    it('should PUT group data', (done) => {
      const update = { name: 'Updated Group', description: 'Updated', color: '#123456' };
      const updated: IGroup = { id: 3, ...update };
      service.updateGroup(3, update).subscribe({
        next: (result) => {
          expect(result.name).toBe('Updated Group');
          done();
        },
        error: done.fail,
      });
      const req = httpMock.expectOne(API_URL + 'groups/3');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(update);
      req.flush(updated);
    });
  });

  describe('removeGroup', () => {
    it('should DELETE group by id', (done) => {
      service.removeGroup(7).subscribe({
        next: () => done(),
        error: done.fail,
      });
      const req = httpMock.expectOne(API_URL + 'groups/7');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('getGroupStatistics', () => {
    it('should GET group statistics for a currency', (done) => {
      const mockStats: IGroupStatistics = {
        sumGoods: 100,
        sumPrice: 5000,
        groupsStatistics: [],
      };
      service.getGroupStatistics(1).subscribe({
        next: (result) => {
          expect(result.sumGoods).toBe(100);
          expect(result.sumPrice).toBe(5000);
          done();
        },
        error: done.fail,
      });
      const req = httpMock.expectOne(API_URL + 'statistics/1/groups-statistics');
      expect(req.request.method).toBe('GET');
      req.flush(mockStats);
    });
  });

  describe('addUserToGroup', () => {
    it('should POST to add user to group', async () => {
      const promise = service.addUserToGroup(10, 3);
      const req = httpMock.expectOne(API_URL + 'groups/3/users/10');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush({});
      await promise;
    });
  });

  describe('removeUserFromGroup', () => {
    it('should DELETE to remove user from group', async () => {
      const promise = service.removeUserFromGroup(10, 3);
      const req = httpMock.expectOne(API_URL + 'groups/3/users/10');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
      await promise;
    });
  });

  describe('error handling', () => {
    it('should emit error when getGroups returns 500', (done) => {
      service.getGroups().subscribe({
        next: () => done.fail('Expected error'),
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        },
      });
      const req = httpMock.expectOne(r => r.url === API_URL + 'groups');
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
