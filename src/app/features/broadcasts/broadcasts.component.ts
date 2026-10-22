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
  template: `
    <div class="space-y-6 max-w-6xl">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="page-title">Broadcasts & Announcements</h1>
          <p class="page-description">
            Dispatch mass corporate communications, leverage AI for messaging, and manage saved
            email templates.
          </p>
        </div>
        <div class="flex items-center space-x-2">
          <button
            type="button"
            (click)="activeTab.set('compose')"
            [class]="
              activeTab() === 'compose'
                ? 'bg-[#2A65F6] text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            "
            class="px-3.5 py-2 rounded-xl text-xs font-semibold transition"
          >
            Compose Broadcast
          </button>
          <button
            type="button"
            (click)="activeTab.set('history'); loadHistory()"
            [class]="
              activeTab() === 'history'
                ? 'bg-[#2A65F6] text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            "
            class="px-3.5 py-2 rounded-xl text-xs font-semibold transition"
          >
            Transmission History
          </button>
        </div>
      </div>

      @if (feedback()) {
        <div
          class="p-4 rounded-xl border text-sm flex items-center justify-between"
          [ngClass]="
            feedback()!.isError
              ? 'bg-red-50 dark:bg-red-950/40 border-red-200 text-red-800 dark:text-red-300'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300'
          "
        >
          <div class="flex items-center space-x-2">
            <span>{{ feedback()!.message }}</span>
          </div>
          <button (click)="feedback.set(null)" class="text-xs font-semibold px-2 py-1">✕</button>
        </div>
      }

      @if (activeTab() === 'compose') {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-6">
            <div class="card p-6 space-y-5">
              <div
                class="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between"
              >
                <div>
                  <h3 class="text-base font-semibold text-slate-900 dark:text-white">
                    Audience Target
                  </h3>
                  <p class="text-xs text-slate-400 mt-0.5">
                    Select recipients for this email broadcast.
                  </p>
                </div>
                <button
                  type="button"
                  (click)="openAiModal()"
                  class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm transition"
                >
                  <span class="mr-1.5">✨</span>
                  <span>Generate with AI</span>
                </button>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  (click)="targetType.set('all')"
                  [class]="
                    targetType() === 'all'
                      ? 'border-[#2A65F6] bg-blue-50/50 dark:bg-blue-950/30 text-[#2A65F6]'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  "
                  class="p-3 rounded-xl border text-center font-medium text-xs transition"
                >
                  <div class="text-base mb-1">🏢</div>
                  <div class="font-semibold">All Employees</div>
                  <div class="text-[11px] opacity-75 mt-0.5">All company staff</div>
                </button>

                <button
                  type="button"
                  (click)="targetType.set('department')"
                  [class]="
                    targetType() === 'department'
                      ? 'border-[#2A65F6] bg-blue-50/50 dark:bg-blue-950/30 text-[#2A65F6]'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  "
                  class="p-3 rounded-xl border text-center font-medium text-xs transition"
                >
                  <div class="text-base mb-1">🏷️</div>
                  <div class="font-semibold">By Department</div>
                  <div class="text-[11px] opacity-75 mt-0.5">Filter team unit</div>
                </button>

                <button
                  type="button"
                  (click)="targetType.set('selected')"
                  [class]="
                    targetType() === 'selected'
                      ? 'border-[#2A65F6] bg-blue-50/50 dark:bg-blue-950/30 text-[#2A65F6]'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  "
                  class="p-3 rounded-xl border text-center font-medium text-xs transition"
                >
                  <div class="text-base mb-1">👤</div>
                  <div class="font-semibold">Selected People</div>
                  <div class="text-[11px] opacity-75 mt-0.5">Pick individuals</div>
                </button>
              </div>

              @if (targetType() === 'department') {
                <div class="pt-2">
                  <label
                    class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Choose Department
                  </label>
                  <select
                    [value]="selectedDepartmentId()"
                    (change)="selectedDepartmentId.set($any($event.target).value)"
                    class="input-control"
                  >
                    @for (opt of departmentOptions(); track opt.value) {
                      <option [value]="opt.value">{{ opt.label }}</option>
                    }
                  </select>
                </div>
              }

              @if (targetType() === 'selected') {
                <div class="pt-2 space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Select Employees ({{ selectedEmployeeIds().length }} selected)
                    </span>
                    <div class="space-x-2">
                      <button
                        type="button"
                        (click)="selectAllEmployees()"
                        class="text-xs text-[#2A65F6] hover:underline font-medium"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        (click)="selectedEmployeeIds.set([])"
                        class="text-xs text-slate-400 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Filter employee list..."
                    [value]="employeeSearch()"
                    (input)="employeeSearch.set($any($event.target).value)"
                    class="input-control text-xs"
                  />

                  <div
                    class="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-800/40"
                  >
                    @for (emp of filteredEmployees(); track emp.employeeId) {
                      <label
                        class="flex items-center justify-between p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 cursor-pointer text-xs transition"
                      >
                        <div class="flex items-center space-x-2.5">
                          <input
                            type="checkbox"
                            [checked]="isEmployeeSelected(emp.employeeId)"
                            (change)="toggleEmployeeSelection(emp.employeeId)"
                            class="rounded border-slate-300 text-[#2A65F6] focus:ring-[#2A65F6]"
                          />
                          <div>
                            <span class="font-semibold text-slate-900 dark:text-white"
                              >{{ emp.firstName }} {{ emp.lastName }}</span
                            >
                            <span class="text-slate-400 ml-1.5">{{ emp.email }}</span>
                          </div>
                        </div>
                        <span class="text-[11px] text-slate-400">{{
                          emp.departmentName || 'General'
                        }}</span>
                      </label>
                    }
                  </div>
                </div>
              }
            </div>

            <div class="card p-6 space-y-5">
              <div
                class="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between"
              >
                <div>
                  <h3 class="text-base font-semibold text-slate-900 dark:text-white">
                    Email Content
                  </h3>
                  <p class="text-xs text-slate-400 mt-0.5">Subject line and communication body.</p>
                </div>
                <div class="flex items-center space-x-2">
                  <select
                    (change)="onTemplateSelect($event)"
                    class="input-control text-xs py-1 px-2.5 w-44"
                  >
                    <option value="">Load Template...</option>
                    @for (tmpl of templates(); track tmpl.templateId) {
                      <option [value]="tmpl.templateId">{{ tmpl.name }}</option>
                    }
                  </select>
                  <button
                    type="button"
                    (click)="openSaveTemplateModal()"
                    class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
                  >
                    Save as Template
                  </button>
                </div>
              </div>

              <div class="space-y-4">
                <div>
                  <label
                    class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Subject Line <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Quarterly Town Hall Meeting & Product Roadmap"
                    [value]="broadcastSubject()"
                    (input)="broadcastSubject.set($any($event.target).value)"
                    class="input-control"
                  />
                </div>

                <div>
                  <label
                    class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Email Body (Plain text or Markdown supported)
                    <span class="text-red-500">*</span>
                  </label>
                  <textarea
                    rows="10"
                    placeholder="Dear Team,&#10;&#10;We are excited to announce our upcoming company quarterly sync..."
                    [value]="broadcastBody()"
                    (input)="broadcastBody.set($any($event.target).value)"
                    class="input-control font-sans text-sm leading-relaxed"
                  ></textarea>
                </div>
              </div>

              <div
                class="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800"
              >
                @if (canSendBroadcast()) {
                  <app-button
                    type="button"
                    [loading]="isSending()"
                    [disabled]="!broadcastSubject().trim() || !broadcastBody().trim()"
                    (click)="sendBroadcast()"
                  >
                    <span class="mr-1.5">🚀</span>
                    <span>Dispatch Broadcast Email</span>
                  </app-button>
                }
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <div class="card p-6 space-y-4 sticky top-6">
              <div
                class="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between"
              >
                <h4 class="text-sm font-semibold text-slate-900 dark:text-white">
                  Live Email Preview
                </h4>
                <app-badge variant="primary">Recipient View</app-badge>
              </div>

              <div
                class="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/30 text-xs space-y-3 font-sans"
              >
                <div
                  class="flex items-center space-x-2.5 pb-3 border-b border-slate-200/80 dark:border-slate-700/80"
                >
                  <div
                    class="w-7 h-7 rounded-lg bg-[#2A65F6] flex items-center justify-center text-white font-bold text-xs"
                  >
                    {{ (authService.currentCompany()?.name || 'W')[0] }}
                  </div>
                  <div>
                    <p class="font-semibold text-slate-900 dark:text-white">
                      {{ authService.currentCompany()?.name || 'WorkivLab' }}
                    </p>
                    <p class="text-[10px] text-slate-400">Via WorkivLab Notifications</p>
                  </div>
                </div>

                <div>
                  <p class="text-[11px] text-slate-400">Subject:</p>
                  <p class="font-semibold text-slate-900 dark:text-white text-sm">
                    {{ broadcastSubject() || '(Enter a subject line...)' }}
                  </p>
                </div>

                <div class="pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                  <p class="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {{
                      broadcastBody() ||
                        'Your composed announcement content will render here for preview before transmission...'
                    }}
                  </p>
                </div>

                <div
                  class="pt-3 border-t border-slate-200/80 dark:border-slate-700/80 text-[10px] text-slate-400"
                >
                  <p>
                    © 2026 {{ authService.currentCompany()?.name || 'WorkivLab Inc' }}. All rights
                    reserved.
                  </p>
                </div>
              </div>

              <div
                class="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 text-[11px] text-blue-800 dark:text-blue-300"
              >
                <p class="font-semibold mb-0.5">High-Deliverability SMTP Gateway</p>
                <p>
                  Broadcasts are delivered asynchronously via verified TLS SMTP credentials
                  configured for your workspace.
                </p>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Custom Cell Templates for Shared Table -->
      <ng-template #targetCell let-ctx>
        <span
          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          {{
            ctx.row.targetType === 'all'
              ? 'All Employees'
              : ctx.row.targetType === 'department'
                ? ctx.row.departmentName || 'Department'
                : 'Selected Staff'
          }}
        </span>
      </ng-template>

      <ng-template #statusResultCell let-ctx>
        <span class="text-xs">
          <span class="text-emerald-600 font-semibold">{{ ctx.row.successCount }} ok</span>
          <span *ngIf="ctx.row.failureCount > 0" class="text-red-500 font-semibold ml-1.5"
            >({{ ctx.row.failureCount }} failed)</span
          >
        </span>
      </ng-template>

      <ng-template #dateCell let-ctx>
        <span class="text-xs text-slate-400 font-mono">
          {{ ctx.row.createdAt | date: 'medium' }}
        </span>
      </ng-template>

      @if (activeTab() === 'history') {
        <theme-table
          [rows]="history()"
          [columns]="historyColumns"
          [searchable]="true"
          [clientSideSearch]="true"
          searchPlaceholder="Search broadcasts history..."
          [showFilterButton]="false"
          [clientSidePagination]="true"
          [pageSize]="10"
          [showPageSizeSelector]="true"
          emptyTitle="No broadcast transmissions recorded yet"
          emptyMessage="No broadcast email logs available."
        ></theme-table>
      }

      <app-modal
        [isOpen]="isAiModalOpen()"
        title="Google Gemini AI Announcement Drafter"
        maxWidthClass="max-w-xl"
        (closed)="closeAiModal()"
      >
        <div class="space-y-4">
          <div
            class="p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/80 text-xs text-blue-800 dark:text-blue-300"
          >
            Tell the AI what you want to communicate, and Gemini will generate a professional email
            draft tailored to your corporate voice.
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Announcement Topic or Key Points <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. End of year bonus announcement, system maintenance on Friday night"
              [value]="aiTopic()"
              (input)="aiTopic.set($any($event.target).value)"
              class="input-control"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tone
              </label>
              <select
                [value]="aiTone()"
                (change)="aiTone.set($any($event.target).value)"
                class="input-control"
              >
                @for (opt of aiToneOptions; track opt.value) {
                  <option [value]="opt.value">{{ opt.label }}</option>
                }
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Audience Context
              </label>
              <select
                [value]="aiAudience()"
                (change)="aiAudience.set($any($event.target).value)"
                class="input-control"
              >
                @for (opt of aiAudienceOptions; track opt.value) {
                  <option [value]="opt.value">{{ opt.label }}</option>
                }
              </select>
            </div>
          </div>

          <div
            class="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800"
          >
            <app-button variant="secondary" type="button" (click)="closeAiModal()"
              >Cancel</app-button
            >
            <app-button type="button" [loading]="isGeneratingAi()" (click)="generateAiDraft()">
              <span>Generate Draft</span>
            </app-button>
          </div>
        </div>
      </app-modal>

      <app-modal
        [isOpen]="isSaveTemplateModalOpen()"
        title="Save as Email Template"
        (closed)="closeSaveTemplateModal()"
      >
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Template Name <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Town Hall Announcement, Office Holiday Notice"
              [value]="newTemplateName()"
              (input)="newTemplateName.set($any($event.target).value)"
              class="input-control"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category <span class="text-slate-400 font-normal text-xs ml-1">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. General, HR, Operations"
              [value]="newTemplateCategory()"
              (input)="newTemplateCategory.set($any($event.target).value)"
              class="input-control"
            />
          </div>

          <div
            class="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800"
          >
            <app-button variant="secondary" type="button" (click)="closeSaveTemplateModal()"
              >Cancel</app-button
            >
            <app-button type="button" [loading]="isSavingTemplate()" (click)="saveTemplate()"
              >Save Template</app-button
            >
          </div>
        </div>
      </app-modal>
    </div>
  `,
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
