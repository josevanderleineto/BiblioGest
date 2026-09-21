export type MaterialType =
  | 'LIVRO'
  | 'EBOOK'
  | 'PERIODICO'
  | 'TCC'
  | 'DISSERTACAO'
  | 'TESE'
  | 'ARTIGO'
  | 'AUDIOVISUAL'
  | 'CARTOGRAFICO'
  | 'ELETRONICO'
  | 'DOCUMENTO'
  | 'OBRA_RARA'
  | 'OUTROS';

export type PatronCategory =
  | 'ALUNO'
  | 'PROFESSOR'
  | 'SERVIDOR'
  | 'PESQUISADOR'
  | 'COMUNIDADE'
  | 'VISITANTE'
  | 'OUTRO';

export type ItemStatus =
  | 'DISPONIVEL'
  | 'EMPRESTADO'
  | 'RESERVADO'
  | 'EM_MANUTENCAO'
  | 'EXTRAVIADO'
  | 'DESCARTADO'
  | 'PERDIDO';

export type LoanStatus = 'ATIVO' | 'DEVOLVIDO' | 'ATRASADO';

export interface User {
  id: string;
  username: string;
  name: string;
  socialName?: string;
  email: string;
  cpf?: string;
  rg?: string;
  phone?: string;
  registrationNumber: string;
  category: PatronCategory;
  role: string;
  roleId?: string;
  library?: string;
  libraryId?: string;
  isActive: boolean;
  validUntil?: string;
  createdAt: string;
  mustChangePassword?: boolean;
  permissions?: string[];
}

export interface MarcSubfield {
  code: string;
  value: string;
}

export interface MarcField {
  tag: string;
  ind1: string;
  ind2: string;
  subfields: MarcSubfield[];
}

export interface BibliographicRecord {
  id: string;
  materialType: MaterialType;
  title: string;
  subtitle?: string;
  authors?: string;
  statementOfResp?: string;
  publicationYear?: number;
  publisher?: string;
  placeOfPublication?: string;
  edition?: string;
  isbn?: string;
  issn?: string;
  language?: string;
  summary?: string;
  subjects?: string;
  cddNotation?: string;
  cduNotation?: string;
  cutterNotation?: string;
  callNumber?: string;
  coverUrl?: string;
  marcData?: MarcField[];
  rdaData?: any;
  items?: Item[];
  createdAt: string;
  updatedAt: string;
}

export interface Library {
  id: string;
  code: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  openingHours?: string;
  isActive: boolean;
}

export interface Item {
  id: string;
  barcode: string;
  tombo: string;
  biblioId: string;
  biblio?: BibliographicRecord;
  libraryId: string;
  library?: Library;
  location?: string;
  shelf?: string;
  status: ItemStatus;
  callNumber?: string;
  price?: number;
  source?: string;
  notes?: string;
}

export interface Loan {
  id: string;
  userId: string;
  user: User;
  itemId: string;
  item: Item;
  checkoutDate: string;
  dueDate: string;
  returnDate?: string;
  renewalCount: number;
  status: LoanStatus;
}

export interface Fine {
  id: string;
  userId: string;
  user: User;
  loanId?: string;
  loan?: Loan;
  amount: number;
  status: 'PENDENTE' | 'PAGO' | 'CANCELADO';
  reason?: string;
  issuedAt: string;
  paidAt?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalBiblios: number;
  totalItems: number;
  availableItems: number;
  activeLoans: number;
  overdueLoans: number;
  totalReservations: number;
  totalPendingFinesAmount: number;
  recentLoans: Loan[];
}
