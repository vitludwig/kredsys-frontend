import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ERoute } from 'src/app/common/types/ERoute';
import {GroupsService} from "../../services/groups.service";
import {MatIconModule} from "@angular/material/icon";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {SharedModule} from "../../../../shared.module";

@Component({
    selector: 'app-group-detail',
    templateUrl: './group-detail.component.html',
    styleUrls: ['./group-detail.component.scss'],
    imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    SharedModule
]
})
export class GroupDetailComponent implements OnInit {
  groupForm: FormGroup;
  groupId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private groupsService: GroupsService
  ) {}

  ngOnInit(): void {
    const groupId = this.route.snapshot.paramMap.get('id');
    this.groupId = groupId === null ? null : +groupId

    this.groupForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      color: ['', Validators.required],
    });

    if (this.groupId != null) {
      this.groupsService.getGroup(this.groupId).subscribe((group) => {
        this.groupForm.patchValue(group);
      });
    }
  }

  saveGroup(): void {
    if (this.groupForm.valid) {
      const groupData = this.groupForm.value;
      if (this.groupId != null) {
        this.groupsService
          .updateGroup(this.groupId, groupData)
          .subscribe(() => {
            this.router.navigate(['/', ERoute.ADMIN, ERoute.ADMIN_GROUPS]);
          });
      } else {
        this.groupsService.createGroup(groupData).subscribe(() => {
          this.router.navigate(['/', ERoute.ADMIN, ERoute.ADMIN_GROUPS]);
        });
      }
    }
  }

  cancel(): void {
    this.router.navigate(['/', ERoute.ADMIN, ERoute.ADMIN_GROUPS]);
  }
}
