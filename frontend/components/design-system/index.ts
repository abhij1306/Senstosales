/**
 * Atomic Design System v1.0 - Component Exports
 * Centralized export file for all design system components
 */

// ==================== ATOMS ====================
export { Button, buttonVariants } from './atoms/Button';
export type { ButtonProps } from './atoms/Button';

export { Input } from './atoms/Input';
export type { InputProps } from './atoms/Input';

export { H1, H2, H3, Body, Label, SmallText, TableText, MonoCode, Accounting } from './atoms/Typography';

export { Card } from './atoms/Card';
export type { CardProps } from './atoms/Card';

export { Badge } from './atoms/Badge';
export type { BadgeProps } from './atoms/Badge';

export { Checkbox } from './atoms/Checkbox';
export type { CheckboxProps } from './atoms/Checkbox';

export { Icon } from './atoms/Icon';
export type { IconProps } from './atoms/Icon';

// ==================== MOLECULES ====================
export { FormField } from './molecules/FormField';
export type { FormFieldProps } from './molecules/FormField';

export { SearchBar } from './molecules/SearchBar';
export type { SearchBarProps } from './molecules/SearchBar';

export { StatusTag } from './molecules/StatusTag';
export type { StatusTagProps } from './molecules/StatusTag';

export { ActionButtonGroup } from './molecules/ActionButtonGroup';
export type { ActionButtonGroupProps, Action } from './molecules/ActionButtonGroup';

export { TableHeaderCell } from './molecules/TableHeaderCell';
export type { TableHeaderCellProps } from './molecules/TableHeaderCell';

export { WarningModal } from './molecules/WarningModal';
export type { WarningModalProps } from './molecules/WarningModal';

export { DocumentJourney } from './molecules/DocumentJourney';
export type { DocumentStage } from './molecules/DocumentJourney';

// Legacy molecules (to be migrated)
export { DetailField } from './molecules/DetailField';
export { StatBlock } from './molecules/StatBlock';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './molecules/Tabs';
export { TableRowCell as TableCells } from './molecules/TableCells';

// ==================== ORGANISMS ====================
export { SummaryCard, SummaryCards } from './organisms/SummaryCards';
export type { SummaryCardProps, SummaryCardsProps } from './organisms/SummaryCards';

export { DocumentTrace } from './organisms/DocumentTrace';
export type { DocumentTraceProps, DocumentNode } from './organisms/DocumentTrace';

export { ReportsToolbar } from './organisms/ReportsToolbar';
export type { ReportsToolbarProps } from './organisms/ReportsToolbar';

export { DataTable } from './organisms/DataTable';
export type { DataTableProps, Column } from './organisms/DataTable';

export { SidebarNav } from './organisms/SidebarNav';

// ==================== TEMPLATES ====================
export { ListPageTemplate } from './templates/ListPageTemplate';
export type { ListPageTemplateProps } from './templates/ListPageTemplate';

export { CreateEditFormTemplate } from './templates/CreateEditFormTemplate';
export type { CreateEditFormTemplateProps, BreadcrumbItem as CreateEditBreadcrumbItem, FormSection } from './templates/CreateEditFormTemplate';

export { DetailViewTemplate } from './templates/DetailViewTemplate';
export type { DetailViewTemplateProps, BreadcrumbItem as DetailViewBreadcrumbItem, TabItem } from './templates/DetailViewTemplate';

export { DocumentTemplate } from './templates/DocumentTemplate';

export { ReportsPageTemplate } from './templates/ReportsPageTemplate';
export type { ReportsPageTemplateProps } from './templates/ReportsPageTemplate';

// ==================== DESIGN TOKENS ====================
export { default as designTokens } from './spec.json';
