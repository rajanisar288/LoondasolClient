import { Component, OnInit, inject, signal, computed, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AppButtonComponent } from '../../shared/components/button/button.component';
import { SelectOption } from '../../shared/components/select/select.component';
import { AppBadgeComponent } from '../../shared/components/badge/badge.component';
import { AppModalComponent } from '../../shared/components/modal/modal.component';
import { SharedTableComponent, SharedTableColumn } from '../../shared/components/table/table.component';

interface DepartmentItem {
  departmentId: string;
  name: string;
}

interface EmployeeItem {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentId?: string;
  departmentName?: string;
  designation?: string;
}

interface BroadcastTemplate {
  templateId: string;
  name: string;
  subject: string;
  body: string;
  category?: string;
}

interface BroadcastLog {
  logId: string;
  subject: string;
  targetType: 'all' | 'department' | 'selected';
  departmentName?: string;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  senderName: string;
  createdAt: string;
}

@Component({
  selector: 'app-broadcasts',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    AppButtonComponent,
    AppBadgeComponent,
    AppModalComponent,
    SharedTableComponent,
  ],
  templateUrl: "./broadcasts.component.html",
  styleUrl: "./broadcasts.component.scss",
})
export class BroadcastsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly authService = inject(AuthService);

  @ViewChild('targetCell') targetCell?: TemplateRef<any>;
  @ViewChild('statusResultCell') statusResultCell?: TemplateRef<any>;
  @ViewChild('dateCell') dateCell?: TemplateRef<any>;

  get historyColumns(): SharedTableColumn<BroadcastLog>[] {
    return [
      {
        key: 'subject',
        header: 'Subject',
        sortable: true,
      },
      {
        key: 'targetType',
        header: 'Audience Target',
        template: this.targetCell,
      },
      {
        key: 'recipientCount',
        header: 'Recipients',
        sortable: true,
      },
      {
        key: 'successCount',
        header: 'Success / Fail',
        template: this.statusResultCell,
      },
      {
        key: 'senderName',
        header: 'Sent By',
        sortable: true,
      },
      {
        key: 'createdAt',
        header: 'Date',
        sortable: true,
        align: 'right',
        template: this.dateCell,
      },
    ];
  }

  canSendBroadcast(): boolean {
    return (
      this.authService.currentUser()?.isOwner === true ||
      this.authService.hasPermission('email_campaigns.send') ||
      this.authService.hasPermission('email_campaigns.create')
    );
  }

  readonly activeTab = signal<'compose' | 'history'>('compose');
  readonly targetType = signal<'all' | 'department' | 'selected'>('all');
  readonly selectedDepartmentId = signal<string>('');
  readonly selectedEmployeeIds = signal<string[]>([]);
  readonly broadcastSubject = signal<string>('');
  readonly broadcastBody = signal<string>('');

  readonly departments = signal<DepartmentItem[]>([]);
  readonly departmentOptions = signal<SelectOption[]>([]);
  readonly employees = signal<EmployeeItem[]>([]);
  readonly employeeSearch = signal<string>('');
  readonly templates = signal<BroadcastTemplate[]>([]);
  readonly history = signal<BroadcastLog[]>([]);

  readonly isSending = signal<boolean>(false);
  readonly feedback = signal<{ message: string; isError?: boolean } | null>(null);

  readonly isAiModalOpen = signal<boolean>(false);
  readonly isGeneratingAi = signal<boolean>(false);
  readonly aiTopic = signal<string>('');
  readonly aiTone = signal<string>('Professional');
  readonly aiAudience = signal<string>('All Employees');

  readonly isSaveTemplateModalOpen = signal<boolean>(false);
  readonly isSavingTemplate = signal<boolean>(false);
  readonly newTemplateName = signal<string>('');
  readonly newTemplateCategory = signal<string>('General');

  readonly aiToneOptions: SelectOption[] = [
    { label: 'Professional & Formal', value: 'Professional' },
    { label: 'Inspiring & Enthusiastic', value: 'Inspiring' },
    { label: 'Warm & Casual', value: 'Casual' },
    { label: 'Urgent & Direct', value: 'Urgent' },
  ];

  readonly aiAudienceOptions: SelectOption[] = [
    { label: 'All Company Staff', value: 'All Employees' },
    { label: 'Engineering & Product', value: 'Engineering' },
    { label: 'Sales & Growth', value: 'Sales' },
    { label: 'Executive Leadership', value: 'Leadership' },
  ];

  readonly filteredEmployees = computed(() => {
    const list = this.employees();
    const query = this.employeeSearch().toLowerCase().trim();
    if (!query) return list;
    return list.filter(
      (e) =>
        e.firstName.toLowerCase().includes(query) ||
        e.lastName.toLowerCase().includes(query) ||
        e.email.toLowerCase().includes(query) ||
        (e.departmentName && e.departmentName.toLowerCase().includes(query)),
    );
  });

  ngOnInit(): void {
    this.loadDepartments();
    this.loadEmployees();
    this.loadTemplates();
  }

  loadDepartments(): void {
    this.api.get<DepartmentItem[]>('departments').subscribe({
      next: (depts) => {
        this.departments.set(depts || []);
        this.departmentOptions.set(
          (depts || []).map((d) => ({ label: d.name, value: d.departmentId })),
        );
        if (depts && depts.length > 0 && !this.selectedDepartmentId()) {
          this.selectedDepartmentId.set(depts[0].departmentId);
        }
      },
      error: () => {},
    });
  }

  loadEmployees(): void {
    this.api.get<{ data: EmployeeItem[] }>('employees', { limit: 200 }).subscribe({
      next: (res) => this.employees.set(res.data || []),
      error: () => {},
    });
  }

  loadTemplates(): void {
    this.api.get<BroadcastTemplate[]>('broadcasts/templates').subscribe({
      next: (data) => this.templates.set(data || []),
      error: () => {},
    });
  }

  loadHistory(): void {
    this.api.get<BroadcastLog[]>('broadcasts/history').subscribe({
      next: (data) => this.history.set(data || []),
      error: () => {},
    });
  }

  isEmployeeSelected(id: string): boolean {
    return this.selectedEmployeeIds().includes(id);
  }

  toggleEmployeeSelection(id: string): void {
    const current = this.selectedEmployeeIds();
    if (current.includes(id)) {
      this.selectedEmployeeIds.set(current.filter((i) => i !== id));
    } else {
      this.selectedEmployeeIds.set([...current, id]);
    }
  }

  selectAllEmployees(): void {
    this.selectedEmployeeIds.set(this.employees().map((e) => e.employeeId));
  }

  onTemplateSelect(event: Event): void {
    const templateId = (event.target as HTMLSelectElement).value;
    if (!templateId) return;
    const found = this.templates().find((t) => t.templateId === templateId);
    if (found) {
      this.broadcastSubject.set(found.subject);
      this.broadcastBody.set(found.body);
    }
  }

  openAiModal(): void {
    this.aiTopic.set('');
    this.isAiModalOpen.set(true);
  }

  closeAiModal(): void {
    this.isAiModalOpen.set(false);
  }

  generateAiDraft(): void {
    const topic = this.aiTopic().trim();
    if (!topic) return;

    this.isGeneratingAi.set(true);
    this.api
      .post<{ subject: string; body: string }>('broadcasts/generate-ai', {
        topic,
        tone: this.aiTone(),
        audience: this.aiAudience(),
      })
      .subscribe({
        next: (draft) => {
          this.broadcastSubject.set(draft.subject);
          this.broadcastBody.set(draft.body);
          this.isGeneratingAi.set(false);
          this.closeAiModal();
          this.feedback.set({ message: 'AI email draft generated successfully!' });
        },
        error: (err) => {
          this.isGeneratingAi.set(false);
          this.feedback.set({
            message: err?.error?.message || 'Failed to generate AI draft',
            isError: true,
          });
        },
      });
  }

  openSaveTemplateModal(): void {
    if (!this.broadcastSubject().trim() || !this.broadcastBody().trim()) {
      this.feedback.set({
        message: 'Please write a subject and body before saving as a template.',
        isError: true,
      });
      return;
    }
    this.newTemplateName.set(this.broadcastSubject());
    this.isSaveTemplateModalOpen.set(true);
  }

  closeSaveTemplateModal(): void {
    this.isSaveTemplateModalOpen.set(false);
  }

  saveTemplate(): void {
    const name = this.newTemplateName().trim();
    if (!name) return;

    this.isSavingTemplate.set(true);
    this.api
      .post<BroadcastTemplate>('broadcasts/templates', {
        name,
        subject: this.broadcastSubject(),
        body: this.broadcastBody(),
        category: this.newTemplateCategory(),
      })
      .subscribe({
        next: (created) => {
          this.templates.set([...this.templates(), created]);
          this.isSavingTemplate.set(false);
          this.closeSaveTemplateModal();
          this.feedback.set({ message: `Template "${name}" saved for future reuse.` });
        },
        error: (err) => {
          this.isSavingTemplate.set(false);
          this.feedback.set({
            message: err?.error?.message || 'Failed to save template',
            isError: true,
          });
        },
      });
  }

  sendBroadcast(): void {
    if (!this.broadcastSubject().trim() || !this.broadcastBody().trim()) return;

    if (this.targetType() === 'selected' && this.selectedEmployeeIds().length === 0) {
      this.feedback.set({
        message: 'Please select at least one employee recipient.',
        isError: true,
      });
      return;
    }

    this.isSending.set(true);
    this.feedback.set(null);

    const payload = {
      targetType: this.targetType(),
      departmentId: this.targetType() === 'department' ? this.selectedDepartmentId() : undefined,
      employeeIds: this.targetType() === 'selected' ? this.selectedEmployeeIds() : undefined,
      subject: this.broadcastSubject().trim(),
      body: this.broadcastBody().trim(),
    };

    this.api
      .post<{ totalRecipients: number; successCount: number; failureCount: number }>(
        'broadcasts/send',
        payload,
      )
      .subscribe({
        next: (res) => {
          this.isSending.set(false);
          this.feedback.set({
            message: `Broadcast successfully dispatched to ${res.successCount} recipients (${res.failureCount} failed).`,
          });
          this.broadcastSubject.set('');
          this.broadcastBody.set('');
        },
        error: (err) => {
          this.isSending.set(false);
          this.feedback.set({
            message: err?.error?.message || 'Failed to send broadcast announcement',
            isError: true,
          });
        },
      });
  }
}
