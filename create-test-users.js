// Script to create test users for development
import bcrypt from 'bcrypt';
import { MemStorage } from './server/storage.ts';

const storage = new MemStorage();

async function createTestUsers() {
  try {
    // Create a tenant user (student)
    const tenantPassword = await bcrypt.hash('tenant123', 10);
    const tenant = await storage.createUser({
      username: 'student_ahmed',
      password: tenantPassword,
      email: 'ahmed.student@enis.tn',
      firstName: 'Ahmed',
      lastName: 'Ben Ali',
      phone: '+216 20 123 456',
      userType: 'tenant'
    });

    // Create an owner user (property owner)
    const ownerPassword = await bcrypt.hash('owner123', 10);
    const owner = await storage.createUser({
      username: 'owner_fatma',
      password: ownerPassword,
      email: 'fatma.immobilier@gmail.com',
      firstName: 'Fatma',
      lastName: 'Trabelsi',
      phone: '+216 98 765 432',
      userType: 'owner'
    });

    console.log('Test users created successfully:');
    console.log('\n=== TENANT USER ===');
    console.log('Username: student_ahmed');
    console.log('Password: tenant123');
    console.log('Email:', tenant.email);
    console.log('Type:', tenant.userType);
    
    console.log('\n=== OWNER USER ===');
    console.log('Username: owner_fatma');  
    console.log('Password: owner123');
    console.log('Email:', owner.email);
    console.log('Type:', owner.userType);

    // Create some sample properties for the owner
    const property1 = await storage.createProperty({
      ownerId: owner.id,
      title: 'Studio moderne près de l\'INSAT',
      description: 'Studio entièrement meublé, parfait pour étudiants. Proche des transports en commun.',
      type: 'studio',
      price: '400',
      priceType: 'mois',
      surface: 30,
      rooms: 1,
      bathrooms: 1,
      address: 'Rue de la Liberté, Tunis',
      latitude: '36.8065',
      longitude: '10.1815',
      amenities: ['wifi', 'cuisine_equipee', 'climatisation'],
      rules: ['non_fumeur', 'pas_animaux'],
      images: [],
      status: 'Disponible',
      deposit: '200',
      utilities: 'Électricité incluse',
      utilitiesIncluded: true,
      categories: ['Étudiant'],
      geographicHighlight: 'À 500m de l\'INSAT'
    });

    const property2 = await storage.createProperty({
      ownerId: owner.id,
      title: 'Appartement familial 3 pièces',
      description: 'Appartement spacieux avec balcon, idéal pour famille. Quartier calme et sécurisé.',
      type: 'apartment',
      price: '800',
      priceType: 'mois',
      surface: 85,
      rooms: 3,
      bathrooms: 2,
      address: 'Avenue Habib Bourguiba, Sfax',
      latitude: '34.7406',
      longitude: '10.7603',
      amenities: ['parking', 'ascenseur', 'balcon', 'chauffage'],
      rules: ['famille_preferee'],
      images: [],
      status: 'Disponible',
      deposit: '400',
      utilities: 'Eau incluse',
      utilitiesIncluded: false,
      categories: ['Famille'],
      geographicHighlight: 'Centre ville de Sfax'
    });

    console.log('\n=== SAMPLE PROPERTIES CREATED ===');
    console.log(`Property 1: ${property1.title} (ID: ${property1.id})`);
    console.log(`Property 2: ${property2.title} (ID: ${property2.id})`);

    return { tenant, owner, properties: [property1, property2] };
  } catch (error) {
    console.error('Error creating test users:', error);
  }
}

export { createTestUsers };