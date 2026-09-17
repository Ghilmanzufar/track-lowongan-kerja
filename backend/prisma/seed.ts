import { PrismaClient, CareerLinkCategory } from '@prisma/client';

const prisma = new PrismaClient();

interface CareerLinkSeed {
  name: string;
  url: string;
  category: CareerLinkCategory;
  sector: string;
  isVerified?: boolean;
  lastVerifiedAt?: Date | null;
  verifiedSource?: string | null;
}

const careerLinks: CareerLinkSeed[] = [
  // ── Swasta (Original CSV & Tech) ───────────────────────────────────
  { name: 'Traveloka',               url: 'https://careers.traveloka.com/',                        category: 'Swasta', sector: 'Informasi dan Komunikasi' },
  { name: 'Trans TV / Transmedia',   url: 'https://karir.transtv.co.id/',                          category: 'Swasta', sector: 'Kesenian, Hiburan, dan Rekreasi' },
  { name: 'Bank Jago',               url: 'https://www.jago.com/id/career/career-at-jago',         category: 'Swasta', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'Tiket.com',               url: 'https://careers.tiket.com/',                            category: 'Swasta', sector: 'Informasi dan Komunikasi' },
  { name: 'Auto 2000',               url: 'https://auto2000.co.id/karir',                          category: 'Swasta', sector: 'Perdagangan Besar dan Eceran; Reparasi dan Perawatan Mobil dan Sepeda Motor' },
  { name: 'Danone',                  url: 'https://danone.co.id/karir/',                           category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Garudafood',              url: 'https://career.garudafood.co.id/Page/JobList.aspx',     category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Bank Syariah Nasional',   url: 'https://jobs.talentics.id/pt-bank-syariah-nasional',   category: 'Swasta', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'Alfamart',                url: 'https://alfakarir.alfamart.co.id',                      category: 'Swasta', sector: 'Perdagangan Besar dan Eceran; Reparasi dan Perawatan Mobil dan Sepeda Motor' },
  { name: 'Indomaret',               url: 'https://career.indomaretgroup.com/',                    category: 'Swasta', sector: 'Perdagangan Besar dan Eceran; Reparasi dan Perawatan Mobil dan Sepeda Motor' },
  { name: 'KOMPAS TV',               url: 'https://karier.kompas.id/#lowongan',                    category: 'Swasta', sector: 'Kesenian, Hiburan, dan Rekreasi' },
  { name: 'CIMB Niaga',              url: 'https://www.cimbniaga.co.id/id/tentang-kami/karir',   category: 'Swasta', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'Blibli',                  url: 'https://careers.blibli.com',                            category: 'Swasta', sector: 'Informasi dan Komunikasi' },
  { name: 'Mayora',                  url: 'https://www.mayoraindah.co.id/landing/karier-18',       category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Astra Isuzu',             url: 'https://astraisuzu.co.id/career/',                      category: 'Swasta', sector: 'Perdagangan Besar dan Eceran; Reparasi dan Perawatan Mobil dan Sepeda Motor' },
  { name: 'KAO Indonesia',           url: 'https://kao.com/id/careers',                            category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Sinar Mas Land',          url: 'https://career.sinarmasland.com',                       category: 'Swasta', sector: 'Real Estat' },
  { name: 'Daikin',                  url: 'https://daikin.co.id/karir',                            category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'AHM - Astra Honda Motor', url: 'https://recruitment.astra-honda.com',                  category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Yakult',                  url: 'https://karir.yakult.co.id/lowongan-pekerjaan',         category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Shopee',                  url: 'https://careers.shopee.co.id/',                         category: 'Swasta', sector: 'Informasi dan Komunikasi' },
  { name: 'Tokopedia',               url: 'https://www.tokopedia.com/careers/jobs',                category: 'Swasta', sector: 'Informasi dan Komunikasi' },
  { name: 'Gojek',                   url: 'https://www.gojek.com/careers',                         category: 'Swasta', sector: 'Informasi dan Komunikasi' },
  { name: 'Grab',                    url: 'https://grab.careers',                                  category: 'Swasta', sector: 'Informasi dan Komunikasi' },
  { name: 'Bukalapak',               url: 'https://www.bukalapak.com/careers',                     category: 'Swasta', sector: 'Informasi dan Komunikasi' },
  { name: 'OVO',                     url: 'https://www.ovo.id/karir',                              category: 'Swasta', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'Dana',                    url: 'https://www.dana.id/career',                            category: 'Swasta', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'Ruangguru',               url: 'https://careers.ruangguru.com',                         category: 'Swasta', sector: 'Pendidikan' },
  { name: 'Astra International',     url: 'https://www.astra.co.id/Karir',                         category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Bank BCA',                url: 'https://www.bca.co.id/id/Tentang-BCA/Karir',            category: 'Swasta', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'Unilever Indonesia',      url: 'https://www.unilever.co.id/careers',                    category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Indofood',                url: 'https://www.indofood.com/id/career',                    category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Telkomsel',               url: 'https://careers.telkomsel.com',                         category: 'Swasta', sector: 'Informasi dan Komunikasi' },
  { name: 'Indosat Ooredoo Hutchison', url: 'https://careers.ioh.co.id',                          category: 'Swasta', sector: 'Informasi dan Komunikasi' },
  { name: 'XL Axiata',               url: 'https://career.xl.co.id',                              category: 'Swasta', sector: 'Informasi dan Komunikasi' },

  // ── Swasta Baru: FMCG & Consumer Goods ─────────────────────────────
  { name: 'Wings Group',             url: 'https://wingscareer.com',                               category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Orang Tua (OT) Group',    url: 'https://career.ot.id',                                  category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Paragon Corp (Wardah, Kahf, Emina)', url: 'https://career.paragon-tpi.com',             category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Kalbe Farma',             url: 'https://karir.kalbe.co.id',                             category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Tempo Scan Pacific',      url: 'https://www.temposcangroup.com/careers',                category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Nutrifood Indonesia',     url: 'https://nutrifood.co.id/karir',                         category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Frisian Flag Indonesia',  url: 'https://www.frisianflag.com/karir',                     category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Sari Roti (Nippon Indosari)', url: 'https://sariroti.com/karir',                       category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Ultrajaya Milk Industry', url: 'https://www.ultrajaya.co.id/career',                   category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Kapal Api Global',        url: 'https://career.kapalapiglobal.com',                     category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Kino Indonesia',          url: 'https://kino.co.id/karir',                              category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Djarum',                  url: 'https://career.djarum.com',                             category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'HM Sampoerna',            url: 'https://sampoerna.pmi.com/careers',                     category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Gudang Garam',            url: 'https://www.gudanggaramtbk.com/karir',                  category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Nestle Indonesia',        url: 'https://www.nestle.co.id/karir',                        category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Ajinomoto Indonesia',     url: 'https://www.ajinomoto.co.id/id/karir',                  category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },

  // ── Swasta Baru: Konglomerasi, Energi & Agribisnis ──────────────────
  { name: 'Sinar Mas (Asia Pulp & Paper)', url: 'https://app.co.id/careers',                       category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Salim Group / Indomarco', url: 'https://www.indomarco.co.id/karir',                     category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Lippo Karir',             url: 'https://www.lippokarir.com',                            category: 'Swasta', sector: 'Real Estat' },
  { name: 'Barito Pacific',          url: 'https://barito-pacific.com/career',                     category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Chandra Asri Petrochemical', url: 'https://chandra-asri.com/careers',                   category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Triputra Group',          url: 'https://triputra-group.com/careers',                    category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'MedcoEnergi',             url: 'https://www.medcoenergi.com/id/sub/karir',              category: 'Swasta', sector: 'Pertambangan dan Penggalian' },
  { name: 'Adaro Energy',            url: 'https://adarocareers.com',                              category: 'Swasta', sector: 'Pertambangan dan Penggalian' },
  { name: 'Indika Energy',           url: 'https://indikaenergy.co.id/career',                     category: 'Swasta', sector: 'Pertambangan dan Penggalian' },
  { name: 'Amman Mineral',           url: 'https://amman.co.id/career',                            category: 'Swasta', sector: 'Pertambangan dan Penggalian' },
  { name: 'Wilmar Indonesia',        url: 'https://e-recruitment.wilmar.co.id',                    category: 'Swasta', sector: 'Pertanian, Kehutanan, dan Perikanan' },
  { name: 'Musim Mas Group',         url: 'https://www.musimmas.com/careers',                      category: 'Swasta', sector: 'Pertanian, Kehutanan, dan Perikanan' },
  { name: 'Royal Golden Eagle (RGE)',url: 'https://www.rgei.com/careers',                          category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },

  // ── Swasta Baru: Otomotif & Manufaktur ──────────────────────────────
  { name: 'Toyota Astra Motor (TAM)', url: 'https://www.toyota.astra.co.id/corporate/career',     category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Astra Daihatsu Motor (ADM)', url: 'https://recruitment.daihatsu.astra.co.id',           category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Mitsubishi Motors Indonesia', url: 'https://www.mitsubishi-motors.co.id/karir',        category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Hyundai Motors Indonesia', url: 'https://www.hyundai.com/id/id/hyundai-story/career',  category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'United Tractors',         url: 'https://career.unitedtractors.com',                     category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Gajah Tunggal',           url: 'https://career.gt-tires.com',                           category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Polytron Indonesia',      url: 'https://polytron.co.id/career',                         category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },

  // ── Swasta Baru: Perbankan & Finansial ──────────────────────────────
  { name: 'Bank Danamon',            url: 'https://www.danamon.co.id/id/Tentang-Danamon/Karir',    category: 'Swasta', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'Bank Permata',            url: 'https://www.permatabank.com/id/tentang-kami/karir',     category: 'Swasta', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'Bank OCBC NISP',          url: 'https://www.ocbc.id/id/karir',                          category: 'Swasta', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'Bank Panin',              url: 'https://www.panin.co.id/tentang-kami/karir',            category: 'Swasta', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'Bank Mega',               url: 'https://bankmega.com/id/karir',                         category: 'Swasta', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'Bank BTPN (Jenius)',      url: 'https://www.btpn.com/id/tentang-kami/karir',            category: 'Swasta', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'BCA Digital (blu)',       url: 'https://blubybcadigital.id/karir',                      category: 'Swasta', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'SeaBank Indonesia',       url: 'https://www.seabank.co.id/careers',                     category: 'Swasta', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'Adira Finance',           url: 'https://adira.co.id/karir',                             category: 'Swasta', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'FIFGROUP (Astra)',        url: 'https://fifgroup.co.id/karir',                          category: 'Swasta', sector: 'Aktivitas Keuangan dan Asuransi' },

  // ── Swasta Baru: Ritel, Gaya Hidup & F&B ───────────────────────────
  { name: 'Mitra Adiperkasa (MAP)',  url: 'https://map.co.id/careers',                             category: 'Swasta', sector: 'Perdagangan Besar dan Eceran; Reparasi dan Perawatan Mobil dan Sepeda Motor' },
  { name: 'Matahari Department Store', url: 'https://career.matahari.com',                         category: 'Swasta', sector: 'Perdagangan Besar dan Eceran; Reparasi dan Perawatan Mobil dan Sepeda Motor' },
  { name: 'Erajaya Group (iBox, Erafone)', url: 'https://recruitment.erajaya.com',                category: 'Swasta', sector: 'Perdagangan Besar dan Eceran; Reparasi dan Perawatan Mobil dan Sepeda Motor' },
  { name: 'Kawan Lama Group (Informa, Ace)', url: 'https://karir.kawanlamagroup.com',             category: 'Swasta', sector: 'Perdagangan Besar dan Eceran; Reparasi dan Perawatan Mobil dan Sepeda Motor' },
  { name: 'Kopi Kenangan',           url: 'https://kopikenangan.com/career',                       category: 'Swasta', sector: 'Penyediaan Akomodasi dan Penyediaan Makan Minum' },
  { name: 'Fore Coffee',             url: 'https://fore.coffee/careers',                           category: 'Swasta', sector: 'Penyediaan Akomodasi dan Penyediaan Makan Minum' },
  { name: 'Janji Jiwa (Jiwa Group)', url: 'https://jiwagroup.com/career',                          category: 'Swasta', sector: 'Penyediaan Akomodasi dan Penyediaan Makan Minum' },
  { name: 'KFC Indonesia (Fast Food Ind)', url: 'https://kfcku.com/karir',                        category: 'Swasta', sector: 'Penyediaan Akomodasi dan Penyediaan Makan Minum' },
  { name: 'Pizza Hut Indonesia',     url: 'https://www.pizzahut.co.id/karir',                      category: 'Swasta', sector: 'Penyediaan Akomodasi dan Penyediaan Makan Minum' },
  { name: 'Cinema XXI',              url: 'https://www.21cineplex.com/karir',                      category: 'Swasta', sector: 'Kesenian, Hiburan, dan Rekreasi' },

  // ── Swasta Baru: Teknologi, Startup & Digital ──────────────────────
  { name: 'Bibit & Stockbit',        url: 'https://career.stockbit.com',                           category: 'Swasta', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'Ajaib',                   url: 'https://ajaib.co.id/karir',                             category: 'Swasta', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'Xendit',                  url: 'https://www.xendit.co/en/careers/',                     category: 'Swasta', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'Flip.id',                 url: 'https://flip.id/karir',                                 category: 'Swasta', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'Halodoc',                 url: 'https://www.halodoc.com/careers',                       category: 'Swasta', sector: 'Aktivitas Kesehatan Manusia dan Aktivitas Sosial' },
  { name: 'Alodokter',               url: 'https://www.alodokter.com/karir',                       category: 'Swasta', sector: 'Aktivitas Kesehatan Manusia dan Aktivitas Sosial' },
  { name: 'Mekari',                  url: 'https://mekari.com/careers',                            category: 'Swasta', sector: 'Informasi dan Komunikasi' },
  { name: 'eFishery',                url: 'https://efishery.com/careers',                          category: 'Swasta', sector: 'Pertanian, Kehutanan, dan Perikanan' },
  { name: 'Sayurbox',                url: 'https://www.sayurbox.com/career',                       category: 'Swasta', sector: 'Pertanian, Kehutanan, dan Perikanan' },
  { name: 'Kredivo Group',           url: 'https://kredivo.com/careers',                           category: 'Swasta', sector: 'Aktivitas Keuangan dan Asuransi' },

  // ── Swasta Baru: Logistik, Transportasi, Media & Kesehatan ─────────
  { name: 'JNE Express',             url: 'https://karir.jne.co.id',                               category: 'Swasta', sector: 'Pengangkutan dan Pergudangan' },
  { name: 'J&T Express',             url: 'https://jet.co.id/career',                              category: 'Swasta', sector: 'Pengangkutan dan Pergudangan' },
  { name: 'SiCepat Ekspres',         url: 'https://karir.sicepat.com',                             category: 'Swasta', sector: 'Pengangkutan dan Pergudangan' },
  { name: 'Blue Bird Group',         url: 'https://www.bluebirdgroup.com/karir',                   category: 'Swasta', sector: 'Pengangkutan dan Pergudangan' },
  { name: 'MNC Group (RCTI, iNews)', url: 'https://career.mncgroup.com',                          category: 'Swasta', sector: 'Kesenian, Hiburan, dan Rekreasi' },
  { name: 'Emtek Group (SCTV, Vidio)', url: 'https://www.emtek.co.id/career',                      category: 'Swasta', sector: 'Kesenian, Hiburan, dan Rekreasi' },
  { name: 'Kompas Gramedia',         url: 'https://career.kompasgramedia.com',                     category: 'Swasta', sector: 'Kesenian, Hiburan, dan Rekreasi' },
  { name: 'Biznet Networks',         url: 'https://www.biznetnetworks.com/career',                 category: 'Swasta', sector: 'Informasi dan Komunikasi' },
  { name: 'Siloam Hospitals',        url: 'https://www.siloamhospitals.com/karir',                 category: 'Swasta', sector: 'Aktivitas Kesehatan Manusia dan Aktivitas Sosial' },
  { name: 'Mitra Keluarga',          url: 'https://mitrakeluarga.com/karir',                       category: 'Swasta', sector: 'Aktivitas Kesehatan Manusia dan Aktivitas Sosial' },
  { name: 'RS Hermina',              url: 'https://herminahospitals.com/id/careers',               category: 'Swasta', sector: 'Aktivitas Kesehatan Manusia dan Aktivitas Sosial' },
  { name: 'Dexa Medica',             url: 'https://www.dexagroup.com/careers',                     category: 'Swasta', sector: 'Industri Pengolahan / Manufaktur' },

  // ── BUMN: Himbara & Perbankan ──────────────────────────────────────
  { name: 'Bank Mandiri',            url: 'https://career.bankmandiri.co.id',                      category: 'BUMN', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'Bank BRI',                url: 'https://e-recruitment.bri.co.id',                       category: 'BUMN', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'Bank BNI',                url: 'https://erecruitment.bni.co.id',                        category: 'BUMN', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'Bank BTN',                url: 'https://rekrutmen.btn.co.id',                           category: 'BUMN', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'Bank BSI',                url: 'https://karir.bankbsi.co.id',                           category: 'BUMN', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'Mandiri Sekuritas',       url: 'https://www.mandirisekuritas.co.id/id/karir',           category: 'BUMN', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'BRI Danareksa Sekuritas', url: 'https://bridanareksa.co.id/karir',                     category: 'BUMN', sector: 'Aktivitas Keuangan dan Asuransi' },

  // ── BUMN: Asuransi, Penjaminan & Pembiayaan ─────────────────────────
  { name: 'Pegadaian',               url: 'https://rekrutmen.pegadaian.co.id',                     category: 'BUMN', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'BPJS Kesehatan',          url: 'https://rekrutmen.bpjs-kesehatan.go.id',                category: 'BUMN', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'BPJS Ketenagakerjaan',    url: 'https://rekrutmen.bpjsketenagakerjaan.go.id',           category: 'BUMN', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'PT Taspen',               url: 'https://rekrutmen.taspen.co.id',                        category: 'BUMN', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'PT Jasindo',              url: 'https://jasindo.co.id/karir',                           category: 'BUMN', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'PT Jamkrindo',            url: 'https://karir.jamkrindo.co.id',                         category: 'BUMN', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'PT Askrindo',             url: 'https://askrindo.co.id/karir',                          category: 'BUMN', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'IFG (Indonesia Financial Group)', url: 'https://ifg.id/karir',                          category: 'BUMN', sector: 'Aktivitas Keuangan dan Asuransi' },

  // ── BUMN: Energi, Migas & Ketenagalistrikan ────────────────────────
  { name: 'Pertamina',               url: 'https://rekrutmen.pertamina.com',                       category: 'BUMN', sector: 'Pertambangan dan Penggalian' },
  { name: 'Pertamina Patra Niaga',   url: 'https://pertaminapatraniaga.com/karir',                 category: 'BUMN', sector: 'Pertambangan dan Penggalian' },
  { name: 'Pertamina Geothermal Energy (PGE)', url: 'https://pge.pertamina.com/career',            category: 'BUMN', sector: 'Pengadaan Listrik, Gas, Uap/Air Panas, dan Udara Dingin' },
  { name: 'Kilang Pertamina Internasional (KPI)', url: 'https://kpi.pertamina.com/career',         category: 'BUMN', sector: 'Pertambangan dan Penggalian' },
  { name: 'Elnusa',                  url: 'https://www.elnusa.co.id/career',                       category: 'BUMN', sector: 'Pertambangan dan Penggalian' },
  { name: 'PGN (Perusahaan Gas Negara)', url: 'https://ir.pgn.co.id/career',                       category: 'BUMN', sector: 'Pengadaan Listrik, Gas, Uap/Air Panas, dan Udara Dingin' },
  { name: 'PLN',                     url: 'https://rekrutmen.pln.co.id',                           category: 'BUMN', sector: 'Pengadaan Listrik, Gas, Uap/Air Panas, dan Udara Dingin' },
  { name: 'PLN Indonesia Power',     url: 'https://www.indonesiapower.co.id/karir',                category: 'BUMN', sector: 'Pengadaan Listrik, Gas, Uap/Air Panas, dan Udara Dingin' },
  { name: 'PLN Nusantara Power',     url: 'https://recruitment.plnnusantarapower.co.id',           category: 'BUMN', sector: 'Pengadaan Listrik, Gas, Uap/Air Panas, dan Udara Dingin' },
  { name: 'PLN Icon Plus',           url: 'https://iconpln.co.id/career',                          category: 'BUMN', sector: 'Informasi dan Komunikasi' },

  // ── BUMN: Pertambangan & Mineral (MIND ID Group) ────────────────────
  { name: 'MIND ID',                 url: 'https://www.mind.id/karir',                             category: 'BUMN', sector: 'Pertambangan dan Penggalian' },
  { name: 'Antam (Aneka Tambang)',   url: 'https://recruitment.antam.com',                         category: 'BUMN', sector: 'Pertambangan dan Penggalian' },
  { name: 'PT Bukit Asam (PTBA)',    url: 'https://www.ptba.co.id/karir',                          category: 'BUMN', sector: 'Pertambangan dan Penggalian' },
  { name: 'PT Timah',                url: 'https://karir.timah.com',                               category: 'BUMN', sector: 'Pertambangan dan Penggalian' },
  { name: 'PT Inalum',               url: 'https://karir.inalum.id',                               category: 'BUMN', sector: 'Pertambangan dan Penggalian' },

  // ── BUMN: Industri Strategis, Manufaktur & Pupuk ───────────────────
  { name: 'Krakatau Steel',          url: 'https://career.krakatausteel.com',                      category: 'BUMN', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'PT Pindad',               url: 'https://rekrutmen.pindad.com',                          category: 'BUMN', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'PT PAL Indonesia',        url: 'https://career.pal.co.id',                              category: 'BUMN', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'PT Dirgantara Indonesia (PTDI)', url: 'https://recruitment.indonesian-aerospace.com',   category: 'BUMN', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'PT Dahana',               url: 'https://www.dahana.id/karir',                           category: 'BUMN', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'PT Semen Indonesia (SIG)', url: 'https://recruitment.sig.id',                           category: 'BUMN', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'PT Semen Padang',         url: 'https://rekrutmen.semenpadang.co.id',                   category: 'BUMN', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'PT Semen Gresik',         url: 'https://semengresik.com/karir',                         category: 'BUMN', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'PT Pupuk Indonesia',      url: 'https://recruitment.pupuk-indonesia.com',               category: 'BUMN', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'PT Pupuk Kaltim (PKT)',   url: 'https://karir.pupuk-kaltim.com',                        category: 'BUMN', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'PT Petrokimia Gresik',    url: 'https://karir.petrokimia-gresik.com',                   category: 'BUMN', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'PT Pupuk Kujang',         url: 'https://pupuk-kujang.co.id/karir',                      category: 'BUMN', sector: 'Industri Pengolahan / Manufaktur' },

  // ── BUMN: Infrastruktur & Karya ────────────────────────────────────
  { name: 'Jasa Marga',              url: 'https://rekrutmen.jasamarga.com',                       category: 'BUMN', sector: 'Konstruksi' },
  { name: 'Wijaya Karya (WIKA)',     url: 'https://career.wika.co.id',                             category: 'BUMN', sector: 'Konstruksi' },
  { name: 'Waskita Karya',           url: 'https://rekrutmen.waskita.co.id',                       category: 'BUMN', sector: 'Konstruksi' },
  { name: 'Adhi Karya',              url: 'https://rekrutmen.adhi.co.id',                          category: 'BUMN', sector: 'Konstruksi' },
  { name: 'Hutama Karya',            url: 'https://rekrutmen.hutamakarya.com',                     category: 'BUMN', sector: 'Konstruksi' },
  { name: 'PT PP (Pembangunan Perumahan)', url: 'https://recruitment.ptpp.co.id',                 category: 'BUMN', sector: 'Konstruksi' },
  { name: 'Nindya Karya',            url: 'https://recruitment.nindyakarya.co.id',                 category: 'BUMN', sector: 'Konstruksi' },
  { name: 'Brantas Abipraya',        url: 'https://rekrutmen.brantas-abipraya.co.id',              category: 'BUMN', sector: 'Konstruksi' },

  // ── BUMN: Transportasi, Logistik & Pelabuhan ───────────────────────
  { name: 'Garuda Indonesia',        url: 'https://career.garuda-indonesia.com',                   category: 'BUMN', sector: 'Pengangkutan dan Pergudangan' },
  { name: 'KAI (Kereta Api Indonesia)', url: 'https://recruitment.kai.id',                         category: 'BUMN', sector: 'Pengangkutan dan Pergudangan' },
  { name: 'KAI Commuter (KCI)',      url: 'https://commuterline.id/karir',                         category: 'BUMN', sector: 'Pengangkutan dan Pergudangan' },
  { name: 'MRT Jakarta',             url: 'https://jakartamrt.co.id/id/karir',                     category: 'BUMN', sector: 'Pengangkutan dan Pergudangan' },
  { name: 'LRT Jakarta',             url: 'https://www.lrtjakarta.co.id/karir',                    category: 'BUMN', sector: 'Pengangkutan dan Pergudangan' },
  { name: 'Angkasa Pura I',          url: 'https://recruitment.angkasapura1.co.id',                category: 'BUMN', sector: 'Pengangkutan dan Pergudangan' },
  { name: 'Angkasa Pura II',         url: 'https://e-recruitment.angkasapura2.co.id',              category: 'BUMN', sector: 'Pengangkutan dan Pergudangan' },
  { name: 'Pelindo',                 url: 'https://rekrutmen.pelindo.co.id',                       category: 'BUMN', sector: 'Pengangkutan dan Pergudangan' },
  { name: 'PT Pelni',                url: 'https://rekrutmen.pelni.co.id',                         category: 'BUMN', sector: 'Pengangkutan dan Pergudangan' },
  { name: 'ASDP Indonesia Ferry',    url: 'https://rekrutmen.asdp.id',                             category: 'BUMN', sector: 'Pengangkutan dan Pergudangan' },
  { name: 'DAMRI',                   url: 'https://rekrutmen.damri.co.id',                         category: 'BUMN', sector: 'Pengangkutan dan Pergudangan' },
  { name: 'PT Pos Indonesia (PosIND)', url: 'https://karir.posindonesia.co.id',                   category: 'BUMN', sector: 'Pengangkutan dan Pergudangan' },

  // ── BUMN: Farmasi, Pangan, Perkebunan & Lembaga Publik ─────────────
  { name: 'Kimia Farma',             url: 'https://rekrutmen.kimiafarma.co.id',                    category: 'BUMN', sector: 'Aktivitas Kesehatan Manusia dan Aktivitas Sosial' },
  { name: 'Bio Farma',               url: 'https://career.bio.co.id',                              category: 'BUMN', sector: 'Aktivitas Kesehatan Manusia dan Aktivitas Sosial' },
  { name: 'Bulog',                   url: 'https://rekrutmen.bulog.co.id',                         category: 'BUMN', sector: 'Pengangkutan dan Pergudangan' },
  { name: 'ID FOOD (PT RNI)',        url: 'https://idfood.co.id/karir',                            category: 'BUMN', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Holding Perkebunan Nusantara (PTPN III)', url: 'https://rekrutmen.holding-perkebunan.com', category: 'BUMN', sector: 'Pertanian, Kehutanan, dan Perikanan' },
  { name: 'Perum Perhutani',         url: 'https://rekrutmen.perhutani.co.id',                     category: 'BUMN', sector: 'Pertanian, Kehutanan, dan Perikanan' },
  { name: 'Peruri (Percetakan Uang RI)', url: 'https://recruitment.peruri.co.id',                 category: 'BUMN', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Telkom Indonesia',        url: 'https://recruitment.telkom.co.id',                      category: 'BUMN', sector: 'Informasi dan Komunikasi' },
  { name: 'TVRI',                    url: 'https://tvri.go.id/karir',                              category: 'BUMN', sector: 'Informasi dan Komunikasi' },
  { name: 'LKBN ANTARA',             url: 'https://antaranews.com/karir',                          category: 'BUMN', sector: 'Informasi dan Komunikasi' },

  // ── Kementerian & Lembaga Negara Republik Indonesia ───────────────
  // Portal Nasional & Lembaga Pengadaan CASN
  { name: 'CPNS / PPPK (BKN)',       url: 'https://sscasn.bkn.go.id',                             category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'BKN (Badan Kepegawaian Negara)', url: 'https://www.bkn.go.id',                          category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },

  // Kementerian Koordinator & Sekretariat Negara
  { name: 'Kemensetneg (Kementerian Sekretariat Negara)', url: 'https://www.setneg.go.id',        category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Sekretariat Kabinet (Setkab)', url: 'https://setkab.go.id',                             category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kemenko Polkam (Politik dan Keamanan)', url: 'https://polkam.go.id',                    category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kemenko Perekonomian',    url: 'https://rekrutmen.ekon.go.id',                         category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kemenko PMK (Pembangunan Manusia & Kebudayaan)', url: 'https://kemenkopmk.go.id',      category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kemenko Infrastruktur & Pembangunan Kewilayahan', url: 'https://maritim.go.id',         category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kemenko Pemberdayaan Masyarakat', url: 'https://kemenkopmk.go.id/pemberdayaan',         category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kemenko Pangan',          url: 'https://pangan.go.id',                                 category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },

  // Kementerian Teknis
  { name: 'Kementerian Keuangan',    url: 'https://rekrutmen.kemenkeu.go.id',                     category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian Dalam Negeri (Kemendagri)', url: 'https://kemendagri.go.id',                category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian Luar Negeri (Kemlu)', url: 'https://e-recruitment.kemlu.go.id',            category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian Pertahanan (Kemhan)', url: 'https://www.kemhan.go.id/ropeg/',              category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian Agama (Kemenag)', url: 'https://casn.kemenag.go.id',                        category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian Hukum (Kemenkum)', url: 'https://casn.kemenkumham.go.id',                  category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian HAM (Hak Asasi Manusia)', url: 'https://kemenkumham.go.id/ham',            category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian Imigrasi dan Pemasyarakatan', url: 'https://kemenkumham.go.id/imigrasi-pemasyarakatan', category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian Pendidikan Dasar dan Menengah (Kemendikdasmen)', url: 'https://casn.kemdikbud.go.id', category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian Pendidikan Tinggi, Sains, dan Teknologi', url: 'https://kemdiktisaintek.kemdikbud.go.id', category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian Kebudayaan',  url: 'https://kebudayaan.kemdikbud.go.id',                   category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian Kesehatan (Kemenkes)', url: 'https://casn.kemkes.go.id',                    category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian Sosial (Kemensos)', url: 'https://casn.kemensos.go.id',                    category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian Ketenagakerjaan (Kemnaker)', url: 'https://karirhub.kemnaker.go.id',        category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian Perindustrian (Kemenperin)', url: 'https://rekrutmen.kemenperin.go.id',    category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian Perdagangan (Kemendag)', url: 'https://rekrutmen.kemendag.go.id',          category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian ESDM',        url: 'https://casn.esdm.go.id',                              category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian PUPR',        url: 'https://rekrutmen.pu.go.id',                           category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian Perumahan & Kawasan Permukiman', url: 'https://pu.go.id/perumahan',        category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian Perhubungan (Kemenhub)', url: 'https://casn.dephub.go.id',                 category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian Kominfo',     url: 'https://rekrutmen.kominfo.go.id',                      category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian Pertanian (Kementan)', url: 'https://casn.pertanian.go.id',                category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian Kehutanan',   url: 'https://casn.menlhk.go.id',                            category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian Lingkungan Hidup / BPLH', url: 'https://menlhk.go.id',                     category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian Kelautan dan Perikanan (KKP)', url: 'https://ropeg.kkp.go.id',            category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian Desa & Pembangunan Daerah Tertinggal', url: 'https://kemendesa.go.id',    category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian Transmigrasi', url: 'https://transmigrasi.kemendesa.go.id',                category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian ATR / BPN (Pertanahan)', url: 'https://rekrutmen.atrbpn.go.id',            category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Bappenas',                url: 'https://rekrutmen.bappenas.go.id',                     category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian PAN-RB',      url: 'https://menpan.go.id',                                 category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian BUMN',        url: 'https://rekrutmen.bumn.go.id',                         category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian Koperasi',    url: 'https://kemenkopukm.go.id/koperasi',                    category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian UMKM',        url: 'https://kemenkopukm.go.id/umkm',                        category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian Pariwisata',  url: 'https://kemenparekraf.go.id/pariwisata',                category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian Ekonomi Kreatif / Baparekraf', url: 'https://kemenparekraf.go.id',         category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian PPPA (Pemberdayaan Perempuan)', url: 'https://kemenpppa.go.id',            category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian Pemuda dan Olahraga (Kemenpora)', url: 'https://kemenpora.go.id',          category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Kementerian Investasi & Hilirisasi / BKPM', url: 'https://bkpm.go.id',                 category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },

  // Lembaga Pemerintah Non-Kementerian (LPNK)
  { name: 'BRIN (Badan Riset & Inovasi Nasional)', url: 'https://casn.brin.go.id',                 category: 'Kementerian', sector: 'Aktivitas Profesional, Ilmiah, dan Teknis' },
  { name: 'BPS (Badan Pusat Statistik)', url: 'https://rekrutmen.bps.go.id',                     category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'BPKP (Badan Pengawasan Keuangan & Pembangunan)', url: 'https://casn.bpkp.go.id',       category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'BPOM (Badan Pengawas Obat dan Makanan)', url: 'https://casn.pom.go.id',                category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'BMKG (Badan Meteorologi, Klimatologi, Geofisika)', url: 'https://rekrutmen.bmkg.go.id', category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'BASARNAS (Pencarian & Pertolongan)', url: 'https://rekrutmen.basarnas.go.id',          category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'BNPB (Penanggulangan Bencana)', url: 'https://bnpb.go.id',                             category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'BNN (Badan Narkotika Nasional)', url: 'https://bnn.go.id',                             category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'BNPT (Penanggulangan Terorisme)', url: 'https://bnpt.go.id',                           category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'BSSN (Siber dan Sandi Negara)', url: 'https://bssn.go.id',                             category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'BIG (Badan Informasi Geospasial)', url: 'https://big.go.id',                           category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'BSN (Badan Standardisasi Nasional)', url: 'https://bsn.go.id',                         category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'BAPETEN (Pengawas Tenaga Nuklir)', url: 'https://bapeten.go.id',                      category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'BKKBN (Kependudukan & Keluarga Berencana)', url: 'https://bkkbn.go.id',                category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'LAN (Lembaga Administrasi Negara)', url: 'https://lan.go.id',                           category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'LKPP (Pengadaan Barang/Jasa Pemerintah)', url: 'https://lkpp.go.id',                   category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Perpustakaan Nasional RI (Perpusnas)', url: 'https://perpusnas.go.id',                  category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Arsip Nasional RI (ANRI)', url: 'https://anri.go.id',                                  category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'BIN (Badan Intelijen Negara)', url: 'https://bin.go.id',                               category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Barantin (Badan Karantina Indonesia)', url: 'https://karantinaindonesia.go.id',        category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Badan Gizi Nasional',     url: 'https://badangizi.go.id',                              category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'BP2MI (Pelindungan Pekerja Migran)', url: 'https://bp2mi.go.id',                      category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'BPIP (Pembinaan Ideologi Pancasila)', url: 'https://bpip.go.id',                        category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },

  // Lembaga Tinggi Negara, Yudikatif & Lembaga Independen
  { name: 'Bank Indonesia',          url: 'https://www.bi.go.id/id/tentang-bi/karir',             category: 'Kementerian', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'OJK',                     url: 'https://www.ojk.go.id/id/tentang-ojk/karir',           category: 'Kementerian', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'LPS (Lembaga Penjamin Simpanan)', url: 'https://www.lps.go.id/karir',                 category: 'Kementerian', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'BPK RI (Badan Pemeriksa Keuangan)', url: 'https://rekrutmen.bpk.go.id',               category: 'Kementerian', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'Kejaksaan Agung RI',      url: 'https://biropeg.kejaksaan.go.id',                       category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Mahkamah Agung',          url: 'https://badilum.mahkamahagung.go.id/rekrutmen',        category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Mahkamah Konstitusi RI (MK)', url: 'https://mkri.id/karir',                            category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Komisi Yudisial RI (KY)', url: 'https://komisiyudisial.go.id',                          category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'KPK',                     url: 'https://rekrutmen.kpk.go.id',                          category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'KPU (Komisi Pemilihan Umum)', url: 'https://kpu.go.id',                               category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Bawaslu RI',              url: 'https://bawaslu.go.id',                                category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Ombudsman RI',            url: 'https://ombudsman.go.id',                              category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Komnas HAM',              url: 'https://komnasham.go.id',                              category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'KPPU (Pengawas Persaingan Usaha)', url: 'https://kppu.go.id',                          category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'LPSK (Perlindungan Saksi & Korban)', url: 'https://lpsk.go.id',                         category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Setjen DPR RI',           url: 'https://dpr.go.id/rekrutmen',                          category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Setjen DPD RI',           url: 'https://dpd.go.id',                                    category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Setjen MPR RI',           url: 'https://mpr.go.id',                                    category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Penerimaan Anggota Polri', url: 'https://penerimaan.polri.go.id',                      category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },
  { name: 'Rekrutmen TNI (AD, AL, AU)', url: 'https://rekrutmen-tni.mil.id',                     category: 'Kementerian', sector: 'Administrasi Pemerintahan, Pertahanan, dan Jaminan Sosial Wajib' },

  // ── Multinasional ──────────────────────────────────────────────────
  // Teknologi, Cloud, AI & Elektronik Global
  { name: 'Google Indonesia',        url: 'https://careers.google.com/locations/jakarta/',         category: 'Multinasional', sector: 'Informasi dan Komunikasi' },
  { name: 'Meta (Facebook)',         url: 'https://www.metacareers.com',                           category: 'Multinasional', sector: 'Informasi dan Komunikasi' },
  { name: 'Microsoft Indonesia',     url: 'https://careers.microsoft.com',                         category: 'Multinasional', sector: 'Informasi dan Komunikasi' },
  { name: 'Apple Indonesia',         url: 'https://jobs.apple.com/id-id/search',                   category: 'Multinasional', sector: 'Informasi dan Komunikasi' },
  { name: 'Amazon / AWS Indonesia',  url: 'https://www.amazon.jobs/en/locations/jakarta-indonesia', category: 'Multinasional', sector: 'Informasi dan Komunikasi' },
  { name: 'IBM Indonesia',           url: 'https://www.ibm.com/careers',                           category: 'Multinasional', sector: 'Informasi dan Komunikasi' },
  { name: 'Cisco Systems Indonesia', url: 'https://jobs.cisco.com',                                category: 'Multinasional', sector: 'Informasi dan Komunikasi' },
  { name: 'Oracle Indonesia',        url: 'https://www.oracle.com/corporate/careers/',             category: 'Multinasional', sector: 'Informasi dan Komunikasi' },
  { name: 'SAP Indonesia',           url: 'https://jobs.sap.com/',                                 category: 'Multinasional', sector: 'Informasi dan Komunikasi' },
  { name: 'Huawei Indonesia',        url: 'https://career.huawei.com',                             category: 'Multinasional', sector: 'Informasi dan Komunikasi' },
  { name: 'ByteDance / TikTok',      url: 'https://jobs.bytedance.com',                            category: 'Multinasional', sector: 'Informasi dan Komunikasi' },
  { name: 'Dell Technologies',       url: 'https://jobs.dell.com',                                 category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'HP Indonesia',            url: 'https://jobs.hp.com',                                   category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Lenovo Indonesia',        url: 'https://jobs.lenovo.com',                               category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Samsung Electronics Indonesia', url: 'https://www.samsung.com/id/aboutsamsung/careers/', category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'LG Electronics Indonesia', url: 'https://www.lg.com/id/about-lg/careers',               category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Sony Indonesia',          url: 'https://www.sony.co.id/id/electronics/karir',           category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Panasonic Gobel Indonesia', url: 'https://www.panasonic.com/id/corporate/karir.html',   category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Schneider Electric Indonesia', url: 'https://www.se.com/id/id/about-us/careers/overview.jsp', category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Siemens Indonesia',       url: 'https://jobs.siemens.com',                              category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Philips Indonesia',       url: 'https://www.careers.philips.com',                       category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },

  // Konsultan Manajemen, Strategis & Finansial Global
  { name: 'McKinsey & Company',      url: 'https://www.mckinsey.com/careers/search-jobs',          category: 'Multinasional', sector: 'Aktivitas Profesional, Ilmiah, dan Teknis' },
  { name: 'Boston Consulting Group (BCG)', url: 'https://careers.bcg.com',                         category: 'Multinasional', sector: 'Aktivitas Profesional, Ilmiah, dan Teknis' },
  { name: 'Bain & Company',          url: 'https://www.bain.com/careers/',                         category: 'Multinasional', sector: 'Aktivitas Profesional, Ilmiah, dan Teknis' },
  { name: 'Kearney Indonesia',       url: 'https://www.kearney.com/careers',                       category: 'Multinasional', sector: 'Aktivitas Profesional, Ilmiah, dan Teknis' },
  { name: 'Oliver Wyman Indonesia',  url: 'https://www.oliverwyman.com/careers.html',              category: 'Multinasional', sector: 'Aktivitas Profesional, Ilmiah, dan Teknis' },
  { name: 'PwC Indonesia',           url: 'https://www.pwc.com/id/en/careers.html',                category: 'Multinasional', sector: 'Aktivitas Profesional, Ilmiah, dan Teknis' },
  { name: 'Deloitte Indonesia',      url: 'https://jobs2.deloitte.com/id/en',                      category: 'Multinasional', sector: 'Aktivitas Profesional, Ilmiah, dan Teknis' },
  { name: 'Ernst & Young (EY)',      url: 'https://www.ey.com/en_id/careers',                      category: 'Multinasional', sector: 'Aktivitas Profesional, Ilmiah, dan Teknis' },
  { name: 'KPMG Indonesia',          url: 'https://home.kpmg/id/en/home/careers.html',             category: 'Multinasional', sector: 'Aktivitas Profesional, Ilmiah, dan Teknis' },
  { name: 'Accenture Indonesia',     url: 'https://www.accenture.com/id-en/careers',               category: 'Multinasional', sector: 'Aktivitas Profesional, Ilmiah, dan Teknis' },
  { name: 'Mercer Indonesia',        url: 'https://www.mercer.com/careers.html',                   category: 'Multinasional', sector: 'Aktivitas Profesional, Ilmiah, dan Teknis' },
  { name: 'Gartner Indonesia',       url: 'https://jobs.gartner.com',                              category: 'Multinasional', sector: 'Aktivitas Profesional, Ilmiah, dan Teknis' },

  // Perbankan, Keuangan & Asuransi Global
  { name: 'Citibank Indonesia (Citi)', url: 'https://careers.citigroup.com',                       category: 'Multinasional', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'HSBC Indonesia',          url: 'https://www.hsbc.co.id/1/2/id/careers',                 category: 'Multinasional', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'Standard Chartered Bank', url: 'https://www.sc.com/en/careers/',                        category: 'Multinasional', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'J.P. Morgan Indonesia',   url: 'https://careers.jpmorgan.com',                          category: 'Multinasional', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'Deutsche Bank Indonesia', url: 'https://careers.db.com',                                category: 'Multinasional', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'MUFG Bank Jakarta',       url: 'https://www.mufg.jp/english/careers/',                  category: 'Multinasional', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'Prudential Indonesia',    url: 'https://www.prudential.co.id/id/karir/',                category: 'Multinasional', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'Allianz Indonesia',       url: 'https://www.allianz.co.id/tentang-kami/karir.html',     category: 'Multinasional', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'Manulife Indonesia',      url: 'https://www.manulife.co.id/id/tentang-kami/karir.html', category: 'Multinasional', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'AIA Financial Indonesia', url: 'https://www.aia-financial.co.id/id/about-aia/careers.html', category: 'Multinasional', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'AXA Indonesia',           url: 'https://axa.co.id/karir',                               category: 'Multinasional', sector: 'Aktivitas Keuangan dan Asuransi' },
  { name: 'Zurich Insurance Indonesia', url: 'https://www.zurich.co.id/id-id/tentang-zurich/karir', category: 'Multinasional', sector: 'Aktivitas Keuangan dan Asuransi' },

  // FMCG, Consumer Health & F&B Global
  { name: 'Procter & Gamble (P&G)',  url: 'https://www.pgcareers.com',                             category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Unilever Global',         url: 'https://careers.unilever.com',                          category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'L\'Oréal Indonesia',      url: 'https://careers.loreal.com',                            category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Johnson & Johnson Indonesia', url: 'https://www.careers.jnj.com',                       category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Mondelez International',  url: 'https://www.mondelezinternational.com/Careers',         category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Kraft Heinz Indonesia',   url: 'https://careers.kraftheinz.com',                        category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Danone Global Careers',   url: 'https://careers.danone.com',                            category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Nestle Global Careers',   url: 'https://www.nestle.com/jobs',                           category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Coca-Cola Europacific Partners', url: 'https://www.cocacolaep.com/id-id/careers/',      category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Mars Indonesia',          url: 'https://careers.mars.com',                              category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'PepsiCo Indonesia',       url: 'https://www.pepsicojobs.com',                           category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Reckitt Indonesia (Dettol)', url: 'https://careers.reckitt.com',                       category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Beiersdorf Indonesia (Nivea)', url: 'https://www.beiersdorf.com/career',               category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Kimberly-Clark Softex',   url: 'https://www.kimberly-clark.com/en-us/careers',          category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Philip Morris International', url: 'https://www.pmi.com/careers',                      category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'British American Tobacco (BAT)', url: 'https://careers.bat.com',                        category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },

  // Farmasi & Healthcare Global
  { name: 'Pfizer Indonesia',        url: 'https://www.pfizer.com/about/careers',                  category: 'Multinasional', sector: 'Aktivitas Kesehatan Manusia dan Aktivitas Sosial' },
  { name: 'Novartis Indonesia',      url: 'https://www.novartis.com/careers',                      category: 'Multinasional', sector: 'Aktivitas Kesehatan Manusia dan Aktivitas Sosial' },
  { name: 'AstraZeneca Indonesia',   url: 'https://careers.astrazeneca.com',                       category: 'Multinasional', sector: 'Aktivitas Kesehatan Manusia dan Aktivitas Sosial' },
  { name: 'Bayer Indonesia',         url: 'https://career.bayer.co.id',                            category: 'Multinasional', sector: 'Aktivitas Kesehatan Manusia dan Aktivitas Sosial' },
  { name: 'Roche Indonesia',         url: 'https://careers.roche.com',                             category: 'Multinasional', sector: 'Aktivitas Kesehatan Manusia dan Aktivitas Sosial' },
  { name: 'Sanofi Indonesia',        url: 'https://www.sanofi.com/en/careers',                     category: 'Multinasional', sector: 'Aktivitas Kesehatan Manusia dan Aktivitas Sosial' },
  { name: 'GSK (GlaxoSmithKline)',   url: 'https://www.gsk.com/en-gb/careers/',                    category: 'Multinasional', sector: 'Aktivitas Kesehatan Manusia dan Aktivitas Sosial' },
  { name: 'Abbott Indonesia',        url: 'https://www.abbott.com/careers.html',                   category: 'Multinasional', sector: 'Aktivitas Kesehatan Manusia dan Aktivitas Sosial' },
  { name: 'MSD (Merck Sharp & Dohme)', url: 'https://jobs.msd.com',                               category: 'Multinasional', sector: 'Aktivitas Kesehatan Manusia dan Aktivitas Sosial' },

  // Energi, Pertambangan, Migas & Kimia Global
  { name: 'ExxonMobil Indonesia',    url: 'https://jobs.exxonmobil.com',                           category: 'Multinasional', sector: 'Pertambangan dan Penggalian' },
  { name: 'BP Indonesia (British Petroleum)', url: 'https://www.bp.com/en/global/corporate/careers.html', category: 'Multinasional', sector: 'Pertambangan dan Penggalian' },
  { name: 'Chevron Indonesia',       url: 'https://careers.chevron.com',                           category: 'Multinasional', sector: 'Pertambangan dan Penggalian' },
  { name: 'Shell Indonesia',         url: 'https://www.shell.co.id/id_id/careers.html',            category: 'Multinasional', sector: 'Pertambangan dan Penggalian' },
  { name: 'Eni Indonesia',           url: 'https://www.eni.com/en-IT/careers.html',                category: 'Multinasional', sector: 'Pertambangan dan Penggalian' },
  { name: 'SLB (Schlumberger)',      url: 'https://careers.slb.com',                               category: 'Multinasional', sector: 'Pertambangan dan Penggalian' },
  { name: 'Halliburton Indonesia',   url: 'https://jobs.halliburton.com',                          category: 'Multinasional', sector: 'Pertambangan dan Penggalian' },
  { name: 'Baker Hughes Indonesia',  url: 'https://careers.bakerhughes.com',                       category: 'Multinasional', sector: 'Pertambangan dan Penggalian' },
  { name: 'Freeport Indonesia (PTFI)', url: 'https://ptfi.co.id/karir',                            category: 'Multinasional', sector: 'Pertambangan dan Penggalian' },
  { name: 'Vale Indonesia',          url: 'https://vale.com/indonesia/karir',                      category: 'Multinasional', sector: 'Pertambangan dan Penggalian' },
  { name: 'TotalEnergies Indonesia', url: 'https://totalenergies.com/careers',                     category: 'Multinasional', sector: 'Pertambangan dan Penggalian' },
  { name: 'BASF Indonesia',          url: 'https://www.basf.com/id/id/careers.html',               category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },

  // Otomotif, Logistik & Manufaktur Industri Global
  { name: 'Honda Prospect Motor',    url: 'https://www.honda-indonesia.com/careers',               category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Yamaha Indonesia Motor',  url: 'https://www.yamaha-motor.co.id/career/',                category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Bridgestone Indonesia',   url: 'https://www.bridgestone.co.id/id/about/career',         category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Michelin Indonesia',      url: 'https://careers.michelin.com',                          category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'DHL Express Indonesia',   url: 'https://careers.dhl.com',                               category: 'Multinasional', sector: 'Pengangkutan dan Pergudangan' },
  { name: 'FedEx Express Indonesia', url: 'https://careers.fedex.com',                             category: 'Multinasional', sector: 'Pengangkutan dan Pergudangan' },
  { name: 'Maersk Indonesia',        url: 'https://www.maersk.com/careers',                        category: 'Multinasional', sector: 'Pengangkutan dan Pergudangan' },
  { name: 'DB Schenker Indonesia',   url: 'https://www.dbschenker.com/global/careers',             category: 'Multinasional', sector: 'Pengangkutan dan Pergudangan' },
  { name: '3M Indonesia',            url: 'https://www.3m.com/3M/en_US/careers-us/',               category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'ABB Indonesia',           url: 'https://careers.abb/global/en',                         category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },
  { name: 'Komatsu Indonesia',       url: 'https://komatsu.co.id/career',                          category: 'Multinasional', sector: 'Industri Pengolahan / Manufaktur' },

  // Ritel, Hospitaliti & Lifestyle Global
  { name: 'IKEA Indonesia',          url: 'https://www.ikea.co.id/in/karir',                       category: 'Multinasional', sector: 'Perdagangan Besar dan Eceran; Reparasi dan Perawatan Mobil dan Sepeda Motor' },
  { name: 'H&M Indonesia',           url: 'https://career.hm.com/en/',                             category: 'Multinasional', sector: 'Perdagangan Besar dan Eceran; Reparasi dan Perawatan Mobil dan Sepeda Motor' },
  { name: 'Uniqlo Indonesia',        url: 'https://www.fastretailing.com/employment/id/',          category: 'Multinasional', sector: 'Perdagangan Besar dan Eceran; Reparasi dan Perawatan Mobil dan Sepeda Motor' },
  { name: 'Decathlon Indonesia',     url: 'https://careers.decathlon.id',                          category: 'Multinasional', sector: 'Perdagangan Besar dan Eceran; Reparasi dan Perawatan Mobil dan Sepeda Motor' },
  { name: 'McDonald\'s Indonesia',   url: 'https://mcdonalds.co.id/karir',                         category: 'Multinasional', sector: 'Penyediaan Akomodasi dan Penyediaan Makan Minum' },
  { name: 'Starbucks Careers',       url: 'https://www.starbucks.com/careers/',                    category: 'Multinasional', sector: 'Penyediaan Akomodasi dan Penyediaan Makan Minum' },
  { name: 'Marriott International',  url: 'https://careers.marriott.com',                          category: 'Multinasional', sector: 'Penyediaan Akomodasi dan Penyediaan Makan Minum' },
  { name: 'Accor Hotels Indonesia',  url: 'https://careers.accor.com',                             category: 'Multinasional', sector: 'Penyediaan Akomodasi dan Penyediaan Makan Minum' },
  { name: 'Hilton Worldwide',        url: 'https://jobs.hilton.com',                               category: 'Multinasional', sector: 'Penyediaan Akomodasi dan Penyediaan Makan Minum' },

  // ── Job Board Umum ─────────────────────────────────────────────────
  { name: 'LinkedIn Jobs',           url: 'https://www.linkedin.com/jobs/',                        category: 'JobBoard', sector: 'Aktivitas Penyewaan dan Sewa Guna Usaha Tanpa Hak Opsi, Ketenagakerjaan, Agen Perjalanan, dan Penunjang Usaha Lainnya' },
  { name: 'Glints',                  url: 'https://glints.com/id/jobs',                            category: 'JobBoard', sector: 'Aktivitas Penyewaan dan Sewa Guna Usaha Tanpa Hak Opsi, Ketenagakerjaan, Agen Perjalanan, dan Penunjang Usaha Lainnya' },
  { name: 'Jobstreet',               url: 'https://www.jobstreet.co.id',                           category: 'JobBoard', sector: 'Aktivitas Penyewaan dan Sewa Guna Usaha Tanpa Hak Opsi, Ketenagakerjaan, Agen Perjalanan, dan Penunjang Usaha Lainnya' },
  { name: 'Kalibrr',                url: 'https://www.kalibrr.com/id-ID',                         category: 'JobBoard', sector: 'Aktivitas Penyewaan dan Sewa Guna Usaha Tanpa Hak Opsi, Ketenagakerjaan, Agen Perjalanan, dan Penunjang Usaha Lainnya' },
  { name: 'Indeed Indonesia',        url: 'https://id.indeed.com',                                 category: 'JobBoard', sector: 'Aktivitas Penyewaan dan Sewa Guna Usaha Tanpa Hak Opsi, Ketenagakerjaan, Agen Perjalanan, dan Penunjang Usaha Lainnya' },
  { name: 'Loker.id',                url: 'https://loker.id',                                      category: 'JobBoard', sector: 'Aktivitas Penyewaan dan Sewa Guna Usaha Tanpa Hak Opsi, Ketenagakerjaan, Agen Perjalanan, dan Penunjang Usaha Lainnya' },
  { name: 'Karir.com',               url: 'https://www.karir.com',                                 category: 'JobBoard', sector: 'Aktivitas Penyewaan dan Sewa Guna Usaha Tanpa Hak Opsi, Ketenagakerjaan, Agen Perjalanan, dan Penunjang Usaha Lainnya', isVerified: true, lastVerifiedAt: new Date('2026-06-15T00:00:00Z'), verifiedSource: 'Audit Direktori (Q2 2026)' },
  { name: 'Urbanhire',               url: 'https://www.urbanhire.com/id',                          category: 'JobBoard', sector: 'Aktivitas Penyewaan dan Sewa Guna Usaha Tanpa Hak Opsi, Ketenagakerjaan, Agen Perjalanan, dan Penunjang Usaha Lainnya', isVerified: false, lastVerifiedAt: new Date('2026-08-20T00:00:00Z'), verifiedSource: 'HTTP 404 (Domain Expired / Inaccessible)' },
  { name: 'Tech in Asia Jobs',       url: 'https://www.techinasia.com/jobs',                       category: 'JobBoard', sector: 'Aktivitas Penyewaan dan Sewa Guna Usaha Tanpa Hak Opsi, Ketenagakerjaan, Agen Perjalanan, dan Penunjang Usaha Lainnya' },
  { name: 'Ekrut',                   url: 'https://www.ekrut.com',                                 category: 'JobBoard', sector: 'Aktivitas Penyewaan dan Sewa Guna Usaha Tanpa Hak Opsi, Ketenagakerjaan, Agen Perjalanan, dan Penunjang Usaha Lainnya', isVerified: true, lastVerifiedAt: new Date('2026-05-10T00:00:00Z'), verifiedSource: 'Audit Direktori (Q2 2026)' },
];

async function main() {
  console.log('Seeding CareerLink data with Industry Sectors & Verification Metadata...');

  const defaultVerifiedAt = new Date('2026-09-10T00:00:00Z');
  const defaultSource = 'Automated Directory Audit 2026';

  let count = 0;
  for (const link of careerLinks) {
    const isVerified = link.isVerified !== undefined ? link.isVerified : true;
    const lastVerifiedAt = link.lastVerifiedAt !== undefined ? link.lastVerifiedAt : defaultVerifiedAt;
    const verifiedSource = link.verifiedSource !== undefined ? link.verifiedSource : defaultSource;

    await prisma.careerLink.upsert({
      where: { name_url: { name: link.name, url: link.url } },
      update: {
        category: link.category,
        sector: link.sector,
        isVerified,
        lastVerifiedAt,
        verifiedSource,
      },
      create: {
        ...link,
        isVerified,
        lastVerifiedAt,
        verifiedSource,
      },
    });
    count++;
  }

  console.log(`Seeded ${count} career links with industry sectors successfully.`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
