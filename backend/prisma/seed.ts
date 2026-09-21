import { PrismaClient, PatronCategory, MaterialType, ItemStatus, LoanStatus, FineStatus, AuthorityType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ENV } from '../src/config/env';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting BiblioGest database seed...');

  if (!ENV.DEFAULT_ADMIN_USERNAME || !ENV.DEFAULT_ADMIN_PASSWORD) {
    throw new Error('Defina DEFAULT_ADMIN_USERNAME e DEFAULT_ADMIN_PASSWORD no arquivo .env antes de executar o seed.');
  }

  // 1. Clear existing data in reverse order of dependencies
  await prisma.auditLog.deleteMany();
  await prisma.fine.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.disposal.deleteMany();
  await prisma.item.deleteMany();
  await prisma.bibliographicAuthority.deleteMany();
  await prisma.authority.deleteMany();
  await prisma.bibliographicRecord.deleteMany();
  await prisma.serialIssue.deleteMany();
  await prisma.serial.deleteMany();
  await prisma.acquisition.deleteMany();
  await prisma.inventoryScan.deleteMany();
  await prisma.circulationRule.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.library.deleteMany();
  await prisma.systemSetting.deleteMany();

  // 2. System Settings
  await prisma.systemSetting.createMany({
    data: [
      { key: 'SYSTEM_NAME', value: 'BiblioGest - Sistema Integrado de Biblioteca' },
      { key: 'DEFAULT_LANGUAGE', value: 'pt-BR' },
      { key: 'DATABASE_MODE', value: 'PostgreSQL' },
      { key: 'CUTTER_RULE', value: 'Sanborn' },
      { key: 'ALLOW_SELF_RENEWAL', value: 'true' },
      { key: 'FINE_ENABLED', value: 'true' },
    ],
  });

  // 3. Permissions
  const permissionsData = [
    { code: 'users.view', name: 'Visualizar Usuários', category: 'Usuários', description: 'Permite consultar lista e perfil de usuários.' },
    { code: 'users.create', name: 'Cadastrar Usuários', category: 'Usuários', description: 'Permite criar novos usuários no sistema.' },
    { code: 'users.edit', name: 'Editar Usuários', category: 'Usuários', description: 'Permite alterar dados de usuários.' },
    { code: 'users.delete', name: 'Excluir Usuários', category: 'Usuários', description: 'Permite inativar ou excluir usuários.' },
    
    { code: 'catalog.view', name: 'Visualizar Acervo', category: 'Catalogação', description: 'Permite pesquisar e ver registros bibliográficos.' },
    { code: 'catalog.create', name: 'Catalogar Obras', category: 'Catalogação', description: 'Permite criar registros em MARC21/RDA.' },
    { code: 'catalog.edit', name: 'Editar Catalogação', category: 'Catalogação', description: 'Permite alterar obras e exemplares.' },
    { code: 'catalog.delete', name: 'Excluir Obras', category: 'Catalogação', description: 'Permite remover registros do acervo.' },
    
    { code: 'circulation.checkout', name: 'Realizar Empréstimos', category: 'Circulação', description: 'Permite registrar empréstimo de exemplares.' },
    { code: 'circulation.return', name: 'Realizar Devoluções', category: 'Circulação', description: 'Permite receber devolução de exemplares.' },
    { code: 'circulation.renew', name: 'Realizar Renovações', category: 'Circulação', description: 'Permite renovar prazos de empréstimo.' },
    
    { code: 'reports.view', name: 'Visualizar Relatórios', category: 'Relatórios', description: 'Permite gerar relatórios e estatísticas.' },
    { code: 'settings.view', name: 'Ver Configurações', category: 'Administração', description: 'Permite acessar configurações do sistema.' },
    { code: 'settings.edit', name: 'Editar Configurações', category: 'Administração', description: 'Permite alterar regras e parâmetros.' },
    { code: 'database.backup', name: 'Gerar Backup', category: 'Banco de Dados', description: 'Permite exportar cópia de segurança.' },
    { code: 'database.restore', name: 'Restaurar Backup', category: 'Banco de Dados', description: 'Permite importar cópia de segurança.' },
  ];

  const createdPermissions = await Promise.all(
    permissionsData.map((p) => prisma.permission.create({ data: p }))
  );

  // 4. Roles
  const adminRole = await prisma.role.create({
    data: {
      name: 'Administrador',
      description: 'Acesso total a todos os módulos e configurações do sistema.',
      isSystem: true,
    },
  });

  const librarianRole = await prisma.role.create({
    data: {
      name: 'Bibliotecário',
      description: 'Gestão de catalogação, usuários, circulação e relatórios.',
      isSystem: true,
    },
  });

  const assistantRole = await prisma.role.create({
    data: {
      name: 'Auxiliar de Biblioteca',
      description: 'Operações de atendimento, empréstimo, devolução e renovação.',
      isSystem: true,
    },
  });

  const catalogerRole = await prisma.role.create({
    data: {
      name: 'Catalogador',
      description: 'Especialista em catalogação MARC21, RDA e controle de autoridades.',
      isSystem: true,
    },
  });

  // Assign ALL permissions to Admin
  await Promise.all(
    createdPermissions.map((p) =>
      prisma.rolePermission.create({
        data: { roleId: adminRole.id, permissionId: p.id },
      })
    )
  );

  // Assign Librarian permissions
  const librarianPermCodes = ['users.view', 'users.create', 'users.edit', 'catalog.view', 'catalog.create', 'catalog.edit', 'circulation.checkout', 'circulation.return', 'circulation.renew', 'reports.view'];
  const librarianPerms = createdPermissions.filter((p) => librarianPermCodes.includes(p.code));
  await Promise.all(
    librarianPerms.map((p) =>
      prisma.rolePermission.create({
        data: { roleId: librarianRole.id, permissionId: p.id },
      })
    )
  );

  // 5. Libraries (Unidades)
  const libCentral = await prisma.library.create({
    data: {
      code: 'BIB-CENTRAL',
      name: 'Biblioteca Central Universitária',
      address: 'Av. Universitária, s/n - Campus Central',
      city: 'Salvador',
      state: 'BA',
      zipCode: '40000-000',
      phone: '(71) 3333-1000',
      email: 'biblioteca.central@universidade.edu.br',
      openingHours: 'Segunda a Sexta, das 07:00 às 22:00',
    },
  });

  const libFeira = await prisma.library.create({
    data: {
      code: 'BIB-FEIRA',
      name: 'Biblioteca Campus Feira de Santana',
      address: 'Rua das Alamedas, 500 - Bairro Universitário',
      city: 'Feira de Santana',
      state: 'BA',
      zipCode: '44000-000',
      phone: '(75) 3222-2000',
      email: 'biblioteca.feira@universidade.edu.br',
      openingHours: 'Segunda a Sexta, das 08:00 às 21:00',
    },
  });

  // 6. Users (Admin + Staff + Patrons)
  const hashedPasswordAdmin = await bcrypt.hash(ENV.DEFAULT_ADMIN_PASSWORD, 10);
  const hashedPasswordPass = await bcrypt.hash('123456', 10);

  // Default Admin User
  const adminUser = await prisma.user.create({
    data: {
      username: ENV.DEFAULT_ADMIN_USERNAME,
      passwordHash: hashedPasswordAdmin,
      mustChangePassword: true, // Requires password change on first access
      name: 'Administrador do Sistema',
      email: 'admin@bibliogest.local',
      registrationNumber: 'ADM-001',
      category: PatronCategory.SERVIDOR,
      roleId: adminRole.id,
      libraryId: libCentral.id,
      cpf: '000.000.000-00',
      phone: '(71) 99999-0000',
    },
  });

  // Librarian User
  const librarianUser = await prisma.user.create({
    data: {
      username: 'maria.bibliotecaria',
      passwordHash: hashedPasswordPass,
      mustChangePassword: false,
      name: 'Maria das Graças Silva',
      email: 'maria.silva@bibliogest.local',
      registrationNumber: 'BIB-1020',
      category: PatronCategory.SERVIDOR,
      roleId: librarianRole.id,
      libraryId: libCentral.id,
      cpf: '111.222.333-44',
      phone: '(71) 98888-1111',
    },
  });

  // Patron Student
  const studentUser = await prisma.user.create({
    data: {
      username: 'joao.aluno',
      passwordHash: hashedPasswordPass,
      mustChangePassword: false,
      name: 'João Pedro Oliveira',
      email: 'joao.oliveira@estudante.edu.br',
      registrationNumber: '202410050',
      category: PatronCategory.ALUNO,
      roleId: assistantRole.id, // Basic access
      libraryId: libCentral.id,
      cpf: '222.333.444-55',
      phone: '(71) 97777-2222',
    },
  });

  // Patron Professor
  const profUser = await prisma.user.create({
    data: {
      username: 'prof.carlos',
      passwordHash: hashedPasswordPass,
      mustChangePassword: false,
      name: 'Dr. Carlos Eduardo Santos',
      email: 'carlos.santos@professor.edu.br',
      registrationNumber: 'DOC-5040',
      category: PatronCategory.PROFESSOR,
      roleId: assistantRole.id,
      libraryId: libFeira.id,
      cpf: '333.444.555-66',
      phone: '(75) 96666-3333',
    },
  });

  // 7. Circulation Rules Matrix
  const categories = Object.values(PatronCategory);
  const materials = Object.values(MaterialType);

  for (const cat of categories) {
    for (const mat of materials) {
      let maxLoans = 3;
      let loanDays = 7;
      let fine = 1.0;

      if (cat === PatronCategory.PROFESSOR) {
        maxLoans = 10;
        loanDays = 30;
        fine = 0.5;
      } else if (cat === PatronCategory.PESQUISADOR) {
        maxLoans = 8;
        loanDays = 21;
        fine = 1.0;
      } else if (cat === PatronCategory.SERVIDOR) {
        maxLoans = 5;
        loanDays = 14;
        fine = 1.0;
      }

      await prisma.circulationRule.create({
        data: {
          userCategory: cat,
          materialType: mat,
          maxLoans,
          loanDays,
          maxRenewals: 2,
          finePerDay: fine,
          gracePeriodDays: 1,
        },
      });
    }
  }

  // 8. Authorities
  const authAuthor = await prisma.authority.create({
    data: {
      type: AuthorityType.PESSOA,
      heading: 'Silva, Edson',
      seeAlso: 'Silva, E.',
      notes: 'Especialista em Ciência da Informação e Arquitetura de Software.',
    },
  });

  const authSubject = await prisma.authority.create({
    data: {
      type: AuthorityType.ASSUNTO,
      heading: 'Ciência da Informação -- Automação de Bibliotecas',
      notes: 'Termo utilizado para sistemas de gestão integrada de acervos.',
    },
  });

  // 9. Bibliographic Records (MARC21 + RDA + CDD + CDU + Cutter)
  const biblio1 = await prisma.bibliographicRecord.create({
    data: {
      materialType: MaterialType.LIVRO,
      title: 'Introdução à Ciência da Informação e Gestão de Bibliotecas',
      subtitle: 'Conceitos, Padrões MARC21 e Práticas Modernas',
      authors: 'Silva, Edson',
      statementOfResp: 'Edson Silva ; prefácio de Maria das Graças.',
      publicationYear: 2024,
      publisher: 'Editora Ciência Aberta',
      placeOfPublication: 'Salvador',
      edition: '2. ed. rev. e ampl.',
      isbn: '978-85-7000-123-4',
      language: 'por',
      summary: 'Obra fundamental abrangendo catalogação bibliográfica em MARC21, RDA, notação Cutter-Sanborn e sistemas modernos de circulação.',
      subjects: 'Ciência da Informação, Automação de Bibliotecas, MARC21, RDA',
      cddNotation: '025.04',
      cduNotation: '02',
      cutterNotation: 'S586i',
      callNumber: '025.04 S586i 2024',
      coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
      marcData: [
        { tag: '001', ind1: ' ', ind2: ' ', subfields: [{ code: 'a', value: 'BG-000001' }] },
        { tag: '020', ind1: ' ', ind2: ' ', subfields: [{ code: 'a', value: '978-85-7000-123-4' }] },
        { tag: '100', ind1: '1', ind2: ' ', subfields: [{ code: 'a', value: 'Silva, Edson,' }, { code: 'e', value: 'autor.' }] },
        { tag: '245', ind1: '1', ind2: '0', subfields: [{ code: 'a', value: 'Introdução à Ciência da Informação e Gestão de Bibliotecas :' }, { code: 'b', value: 'conceitos, padrões MARC21 e práticas modernas /' }, { code: 'c', value: 'Edson Silva.' }] },
        { tag: '260', ind1: ' ', ind2: ' ', subfields: [{ code: 'a', value: 'Salvador :' }, { code: 'b', value: 'Editora Ciência Aberta,' }, { code: 'c', value: '2024.' }] },
        { tag: '300', ind1: ' ', ind2: ' ', subfields: [{ code: 'a', value: '320 p. :' }, { code: 'b', value: 'il. ;' }, { code: 'c', value: '23 cm.' }] },
        { tag: '650', ind1: ' ', ind2: '4', subfields: [{ code: 'a', value: 'Ciência da Informação' }] },
        { tag: '650', ind1: ' ', ind2: '4', subfields: [{ code: 'a', value: 'Automação de Bibliotecas' }] },
      ],
      rdaData: {
        contentTypes: ['texto'],
        mediaTypes: ['sem mediação'],
        carrierTypes: ['volume'],
      },
    },
  });

  const biblio2 = await prisma.bibliographicRecord.create({
    data: {
      materialType: MaterialType.LIVRO,
      title: 'Estrutura de Dados e Algoritmos com TypeScript',
      subtitle: 'Guia Prático para Desenvolvedores',
      authors: 'Vasconcelos, Roberto',
      statementOfResp: 'Roberto Vasconcelos.',
      publicationYear: 2025,
      publisher: 'TechPress Brasil',
      placeOfPublication: 'São Paulo',
      edition: '1. ed.',
      isbn: '978-85-9000-456-7',
      language: 'por',
      summary: 'Explora estruturas de dados avançadas, árvores B, tabelas hash e algoritmos de ordenação aplicados em TypeScript.',
      subjects: 'Ciência da Computação, Algoritmos, TypeScript, Estruturas de Dados',
      cddNotation: '005.133',
      cduNotation: '004.43',
      cutterNotation: 'V331e',
      callNumber: '005.133 V331e 2025',
      coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
      marcData: [
        { tag: '001', ind1: ' ', ind2: ' ', subfields: [{ code: 'a', value: 'BG-000002' }] },
        { tag: '020', ind1: ' ', ind2: ' ', subfields: [{ code: 'a', value: '978-85-9000-456-7' }] },
        { tag: '100', ind1: '1', ind2: ' ', subfields: [{ code: 'a', value: 'Vasconcelos, Roberto,' }, { code: 'e', value: 'autor.' }] },
        { tag: '245', ind1: '1', ind2: '0', subfields: [{ code: 'a', value: 'Estrutura de Dados e Algoritmos com TypeScript :' }, { code: 'b', value: 'guia prático para desenvolvedores /' }, { code: 'c', value: 'Roberto Vasconcelos.' }] },
        { tag: '260', ind1: ' ', ind2: ' ', subfields: [{ code: 'a', value: 'São Paulo :' }, { code: 'b', value: 'TechPress Brasil,' }, { code: 'c', value: '2025.' }] },
      ],
    },
  });

  // Connect Bibliographic record to Authority
  await prisma.bibliographicAuthority.create({
    data: {
      biblioId: biblio1.id,
      authorityId: authAuthor.id,
    },
  });

  // 10. Items (Exemplares)
  const item1 = await prisma.item.create({
    data: {
      barcode: '100001',
      tombo: 'T-2024-001',
      biblioId: biblio1.id,
      libraryId: libCentral.id,
      location: 'Acervo Geral',
      shelf: 'Estante 01 - Prateleira A',
      status: ItemStatus.EMPRESTADO,
      price: 85.0,
      source: 'Compra Direta',
    },
  });

  const item2 = await prisma.item.create({
    data: {
      barcode: '100002',
      tombo: 'T-2024-002',
      biblioId: biblio1.id,
      libraryId: libCentral.id,
      location: 'Acervo Geral',
      shelf: 'Estante 01 - Prateleira A',
      status: ItemStatus.DISPONIVEL,
      price: 85.0,
      source: 'Compra Direta',
    },
  });

  const item3 = await prisma.item.create({
    data: {
      barcode: '200001',
      tombo: 'T-2025-010',
      biblioId: biblio2.id,
      libraryId: libFeira.id,
      location: 'Acervo de Informática',
      shelf: 'Estante 04 - Prateleira C',
      status: ItemStatus.DISPONIVEL,
      price: 120.0,
      source: 'Doação',
    },
  });

  // 11. Active Loans
  const today = new Date();
  const pastDueDate = new Date();
  pastDueDate.setDate(today.getDate() - 3); // Overdue by 3 days

  const loan1 = await prisma.loan.create({
    data: {
      userId: studentUser.id,
      itemId: item1.id,
      checkoutDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
      dueDate: pastDueDate,
      status: LoanStatus.ATRASADO,
      notes: 'Empréstimo em atraso gerando multa.',
    },
  });

  // 12. Fines
  await prisma.fine.create({
    data: {
      userId: studentUser.id,
      loanId: loan1.id,
      amount: 3.0, // 3 days overdue * 1.00 fine
      status: FineStatus.PENDENTE,
      reason: 'Atraso de 3 dias na devolução do exemplar 100001.',
    },
  });

  // 13. Serials
  const serial1 = await prisma.serial.create({
    data: {
      issn: '1234-5678',
      title: 'Revista Brasileira de Biblioteconomia e Documentação',
      publisher: 'FEBAB',
      frequency: 'Trimestral',
      location: 'Hemeroteca',
    },
  });

  await prisma.serialIssue.create({
    data: {
      serialId: serial1.id,
      volume: 'v. 20',
      number: 'n. 1',
      year: 2024,
      publishedAt: new Date('2024-03-01'),
      notes: 'Fascículo especial sobre IA em Bibliotecas.',
    },
  });

  // 14. Acquisitions
  await prisma.acquisition.create({
    data: {
      title: 'Redes de Computadores e a Internet',
      author: 'Kurose, James',
      isbn: '978-85-4300-000-1',
      supplier: 'Distribuidora de Livros LTDA',
      acquisitionType: 'Compra',
      quantity: 5,
      unitValue: 150.0,
      totalValue: 750.0,
      invoiceNumber: 'NF-98431',
    },
  });

  console.log('✅ Seed finished successfully!');
  console.log('----------------------------------------------------');
  console.log('🔑 Credentials for initial access:');
  console.log(`   Username: ${ENV.DEFAULT_ADMIN_USERNAME}`);
  console.log('   Password: configured through DEFAULT_ADMIN_PASSWORD in .env');
  console.log('   (Note: Password change is required on first login)');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
