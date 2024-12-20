'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search } from 'lucide-react'
import Image from 'next/image'
import { db } from '@/lib/firebase'
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore'
import { Facebook, Twitter, Linkedin, Instagram, Copy } from 'lucide-react'
import { useVerification } from '@/providers/VerifiedContext'
import { useToast } from '@/hooks/use-toast'

interface Country {
  name: string
  code: string
  flag: string
}

const COUNTRIES: Country[] = [
  { name: 'Mexico', code: '+52', flag: '/flags/mx.svg' },
  { name: 'United States', code: '+1', flag: '/flags/us.svg' },
  { name: 'Afghanistan', code: '+93', flag: '/flags/af.svg' },
  { name: 'Albania', code: '+355', flag: '/flags/al.svg' },
  { name: 'Algeria', code: '+213', flag: '/flags/dz.svg' },
  { name: 'Andorra', code: '+376', flag: '/flags/ad.svg' },
  { name: 'Angola', code: '+244', flag: '/flags/ao.svg' },
  { name: 'Antigua and Barbuda', code: '+1268', flag: '/flags/ag.svg' },
  { name: 'Argentina', code: '+54', flag: '/flags/ar.svg' },
  { name: 'Armenia', code: '+374', flag: '/flags/am.svg' },
  { name: 'Australia', code: '+61', flag: '/flags/au.svg' },
  { name: 'Austria', code: '+43', flag: '/flags/at.svg' },
  { name: 'Azerbaijan', code: '+994', flag: '/flags/az.svg' },
  { name: 'Bahamas', code: '+1242', flag: '/flags/bs.svg' },
  { name: 'Bahrain', code: '+973', flag: '/flags/bh.svg' },
  { name: 'Bangladesh', code: '+880', flag: '/flags/bd.svg' },
  { name: 'Barbados', code: '+1246', flag: '/flags/bb.svg' },
  { name: 'Belarus', code: '+375', flag: '/flags/by.svg' },
  { name: 'Belgium', code: '+32', flag: '/flags/be.svg' },
  { name: 'Belize', code: '+501', flag: '/flags/bz.svg' },
  { name: 'Benin', code: '+229', flag: '/flags/bj.svg' },
  { name: 'Bhutan', code: '+975', flag: '/flags/bt.svg' },
  { name: 'Bolivia', code: '+591', flag: '/flags/bo.svg' },
  { name: 'Bosnia and Herzegovina', code: '+387', flag: '/flags/ba.svg' },
  { name: 'Botswana', code: '+267', flag: '/flags/bw.svg' },
  { name: 'Brazil', code: '+55', flag: '/flags/br.svg' },
  { name: 'Brunei', code: '+673', flag: '/flags/bn.svg' },
  { name: 'Bulgaria', code: '+359', flag: '/flags/bg.svg' },
  { name: 'Burkina Faso', code: '+226', flag: '/flags/bf.svg' },
  { name: 'Burundi', code: '+257', flag: '/flags/bi.svg' },
  { name: 'Cambodia', code: '+855', flag: '/flags/kh.svg' },
  { name: 'Cameroon', code: '+237', flag: '/flags/cm.svg' },
  { name: 'Canada', code: '+1', flag: '/flags/ca.svg' },
  { name: 'Cape Verde', code: '+238', flag: '/flags/cv.svg' },
  { name: 'Central African Republic', code: '+236', flag: '/flags/cf.svg' },
  { name: 'Chad', code: '+235', flag: '/flags/td.svg' },
  { name: 'Chile', code: '+56', flag: '/flags/cl.svg' },
  { name: 'China', code: '+86', flag: '/flags/cn.svg' },
  { name: 'Colombia', code: '+57', flag: '/flags/co.svg' },
  { name: 'Comoros', code: '+269', flag: '/flags/km.svg' },
  { name: 'Congo', code: '+242', flag: '/flags/cg.svg' },
  { name: 'Costa Rica', code: '+506', flag: '/flags/cr.svg' },
  { name: 'Croatia', code: '+385', flag: '/flags/hr.svg' },
  { name: 'Cuba', code: '+53', flag: '/flags/cu.svg' },
  { name: 'Cyprus', code: '+357', flag: '/flags/cy.svg' },
  { name: 'Czech Republic', code: '+420', flag: '/flags/cz.svg' },
  { name: 'Denmark', code: '+45', flag: '/flags/dk.svg' },
  { name: 'Djibouti', code: '+253', flag: '/flags/dj.svg' },
  { name: 'Dominica', code: '+1767', flag: '/flags/dm.svg' },
  { name: 'Dominican Republic', code: '+1849', flag: '/flags/do.svg' },
  { name: 'East Timor', code: '+670', flag: '/flags/tl.svg' },
  { name: 'Ecuador', code: '+593', flag: '/flags/ec.svg' },
  { name: 'Egypt', code: '+20', flag: '/flags/eg.svg' },
  { name: 'El Salvador', code: '+503', flag: '/flags/sv.svg' },
  { name: 'Equatorial Guinea', code: '+240', flag: '/flags/gq.svg' },
  { name: 'Eritrea', code: '+291', flag: '/flags/er.svg' },
  { name: 'Estonia', code: '+372', flag: '/flags/ee.svg' },
  { name: 'Ethiopia', code: '+251', flag: '/flags/et.svg' },
  { name: 'Fiji', code: '+679', flag: '/flags/fj.svg' },
  { name: 'Finland', code: '+358', flag: '/flags/fi.svg' },
  { name: 'France', code: '+33', flag: '/flags/fr.svg' },
  { name: 'Gabon', code: '+241', flag: '/flags/ga.svg' },
  { name: 'Gambia', code: '+220', flag: '/flags/gm.svg' },
  { name: 'Georgia', code: '+995', flag: '/flags/ge.svg' },
  { name: 'Germany', code: '+49', flag: '/flags/de.svg' },
  { name: 'Ghana', code: '+233', flag: '/flags/gh.svg' },
  { name: 'Greece', code: '+30', flag: '/flags/gr.svg' },
  { name: 'Grenada', code: '+1473', flag: '/flags/gd.svg' },
  { name: 'Guatemala', code: '+502', flag: '/flags/gt.svg' },
  { name: 'Guinea', code: '+224', flag: '/flags/gn.svg' },
  { name: 'Guinea-Bissau', code: '+245', flag: '/flags/gw.svg' },
  { name: 'Guyana', code: '+592', flag: '/flags/gy.svg' },
  { name: 'Haiti', code: '+509', flag: '/flags/ht.svg' },
  { name: 'Honduras', code: '+504', flag: '/flags/hn.svg' },
  { name: 'Hungary', code: '+36', flag: '/flags/hu.svg' },
  { name: 'Iceland', code: '+354', flag: '/flags/is.svg' },
  { name: 'India', code: '+91', flag: '/flags/in.svg' },
  { name: 'Indonesia', code: '+62', flag: '/flags/id.svg' },
  { name: 'Iran', code: '+98', flag: '/flags/ir.svg' },
  { name: 'Iraq', code: '+964', flag: '/flags/iq.svg' },
  { name: 'Ireland', code: '+353', flag: '/flags/ie.svg' },
  { name: 'Israel', code: '+972', flag: '/flags/il.svg' },
  { name: 'Italy', code: '+39', flag: '/flags/it.svg' },
  { name: 'Jamaica', code: '+1876', flag: '/flags/jm.svg' },
  { name: 'Japan', code: '+81', flag: '/flags/jp.svg' },
  { name: 'Jordan', code: '+962', flag: '/flags/jo.svg' },
  { name: 'Kazakhstan', code: '+7', flag: '/flags/kz.svg' },
  { name: 'Kenya', code: '+254', flag: '/flags/ke.svg' },
  { name: 'Kiribati', code: '+686', flag: '/flags/ki.svg' },
  { name: 'Korea, North', code: '+850', flag: '/flags/kp.svg' },
  { name: 'Korea, South', code: '+82', flag: '/flags/kr.svg' },
  { name: 'Kuwait', code: '+965', flag: '/flags/kw.svg' },
  { name: 'Kyrgyzstan', code: '+996', flag: '/flags/kg.svg' },
  { name: 'Laos', code: '+856', flag: '/flags/la.svg' },
  { name: 'Latvia', code: '+371', flag: '/flags/lv.svg' },
  { name: 'Lebanon', code: '+961', flag: '/flags/lb.svg' },
  { name: 'Lesotho', code: '+266', flag: '/flags/ls.svg' },
  { name: 'Liberia', code: '+231', flag: '/flags/lr.svg' },
  { name: 'Libya', code: '+218', flag: '/flags/ly.svg' },
  { name: 'Liechtenstein', code: '+423', flag: '/flags/li.svg' },
  { name: 'Lithuania', code: '+370', flag: '/flags/lt.svg' },
  { name: 'Luxembourg', code: '+352', flag: '/flags/lu.svg' },
  { name: 'Macedonia', code: '+389', flag: '/flags/mk.svg' },
  { name: 'Madagascar', code: '+261', flag: '/flags/mg.svg' },
  { name: 'Malawi', code: '+265', flag: '/flags/mw.svg' },
  { name: 'Malaysia', code: '+60', flag: '/flags/my.svg' },
  { name: 'Maldives', code: '+960', flag: '/flags/mv.svg' },
  { name: 'Mali', code: '+223', flag: '/flags/ml.svg' },
  { name: 'Malta', code: '+356', flag: '/flags/mt.svg' },
  { name: 'Marshall Islands', code: '+692', flag: '/flags/mh.svg' },
  { name: 'Mauritania', code: '+222', flag: '/flags/mr.svg' },
  { name: 'Mauritius', code: '+230', flag: '/flags/mu.svg' },

  { name: 'Micronesia', code: '+691', flag: '/flags/fm.svg' },
  { name: 'Moldova', code: '+373', flag: '/flags/md.svg' },
  { name: 'Monaco', code: '+377', flag: '/flags/mc.svg' },
  { name: 'Mongolia', code: '+976', flag: '/flags/mn.svg' },
  { name: 'Montenegro', code: '+382', flag: '/flags/me.svg' },
  { name: 'Morocco', code: '+212', flag: '/flags/ma.svg' },
  { name: 'Mozambique', code: '+258', flag: '/flags/mz.svg' },
  { name: 'Myanmar', code: '+95', flag: '/flags/mm.svg' },
  { name: 'Namibia', code: '+264', flag: '/flags/na.svg' },
  { name: 'Nauru', code: '+674', flag: '/flags/nr.svg' },
  { name: 'Nepal', code: '+977', flag: '/flags/np.svg' },
  { name: 'Netherlands', code: '+31', flag: '/flags/nl.svg' },
  { name: 'New Zealand', code: '+64', flag: '/flags/nz.svg' },
  { name: 'Nicaragua', code: '+505', flag: '/flags/ni.svg' },
  { name: 'Niger', code: '+227', flag: '/flags/ne.svg' },
  { name: 'Nigeria', code: '+234', flag: '/flags/ng.svg' },
  { name: 'Norway', code: '+47', flag: '/flags/no.svg' },
  { name: 'Oman', code: '+968', flag: '/flags/om.svg' },
  { name: 'Pakistan', code: '+92', flag: '/flags/pk.svg' },
  { name: 'Palau', code: '+680', flag: '/flags/pw.svg' },
  { name: 'Panama', code: '+507', flag: '/flags/pa.svg' },
  { name: 'Papua New Guinea', code: '+675', flag: '/flags/pg.svg' },
  { name: 'Paraguay', code: '+595', flag: '/flags/py.svg' },
  { name: 'Peru', code: '+51', flag: '/flags/pe.svg' },
  { name: 'Philippines', code: '+63', flag: '/flags/ph.svg' },
  { name: 'Poland', code: '+48', flag: '/flags/pl.svg' },
  { name: 'Portugal', code: '+351', flag: '/flags/pt.svg' },
  { name: 'Qatar', code: '+974', flag: '/flags/qa.svg' },
  { name: 'Romania', code: '+40', flag: '/flags/ro.svg' },
  { name: 'Russia', code: '+7', flag: '/flags/ru.svg' },
  { name: 'Rwanda', code: '+250', flag: '/flags/rw.svg' },
  { name: 'Saint Kitts and Nevis', code: '+1869', flag: '/flags/kn.svg' },
  { name: 'Saint Lucia', code: '+1758', flag: '/flags/lc.svg' },
  { name: 'Saint Vincent and the Grenadines', code: '+1784', flag: '/flags/vc.svg' },
  { name: 'Samoa', code: '+685', flag: '/flags/ws.svg' },
  { name: 'San Marino', code: '+378', flag: '/flags/sm.svg' },
  { name: 'Sao Tome and Principe', code: '+239', flag: '/flags/st.svg' },
  { name: 'Saudi Arabia', code: '+966', flag: '/flags/sa.svg' },
  { name: 'Senegal', code: '+221', flag: '/flags/sn.svg' },
  { name: 'Serbia', code: '+381', flag: '/flags/rs.svg' },
  { name: 'Seychelles', code: '+248', flag: '/flags/sc.svg' },
  { name: 'Sierra Leone', code: '+232', flag: '/flags/sl.svg' },
  { name: 'Singapore', code: '+65', flag: '/flags/sg.svg' },
  { name: 'Slovakia', code: '+421', flag: '/flags/sk.svg' },
  { name: 'Slovenia', code: '+386', flag: '/flags/si.svg' },
  { name: 'Solomon Islands', code: '+677', flag: '/flags/sb.svg' },
  { name: 'Somalia', code: '+252', flag: '/flags/so.svg' },
  { name: 'South Africa', code: '+27', flag: '/flags/za.svg' },
  { name: 'South Sudan', code: '+211', flag: '/flags/ss.svg' },
  { name: 'Spain', code: '+34', flag: '/flags/es.svg' },
  { name: 'Sri Lanka', code: '+94', flag: '/flags/lk.svg' },
  { name: 'Sudan', code: '+249', flag: '/flags/sd.svg' },
  { name: 'Suriname', code: '+597', flag: '/flags/sr.svg' },
  { name: 'Swaziland', code: '+268', flag: '/flags/sz.svg' },
  { name: 'Sweden', code: '+46', flag: '/flags/se.svg' },
  { name: 'Switzerland', code: '+41', flag: '/flags/ch.svg' },
  { name: 'Syria', code: '+963', flag: '/flags/sy.svg' },
  { name: 'Taiwan', code: '+886', flag: '/flags/tw.svg' },
  { name: 'Tajikistan', code: '+992', flag: '/flags/tj.svg' },
  { name: 'Tanzania', code: '+255', flag: '/flags/tz.svg' },
  { name: 'Thailand', code: '+66', flag: '/flags/th.svg' },
  { name: 'Togo', code: '+228', flag: '/flags/tg.svg' },
  { name: 'Tonga', code: '+676', flag: '/flags/to.svg' },
  { name: 'Trinidad and Tobago', code: '+1868', flag: '/flags/tt.svg' },
  { name: 'Tunisia', code: '+216', flag: '/flags/tn.svg' },
  { name: 'Turkey', code: '+90', flag: '/flags/tr.svg' },
  { name: 'Turkmenistan', code: '+993', flag: '/flags/tm.svg' },
  { name: 'Tuvalu', code: '+688', flag: '/flags/tv.svg' },
  { name: 'Uganda', code: '+256', flag: '/flags/ug.svg' },
  { name: 'Ukraine', code: '+380', flag: '/flags/ua.svg' },
  { name: 'United Arab Emirates', code: '+971', flag: '/flags/ae.svg' },
  { name: 'United Kingdom', code: '+44', flag: '/flags/gb.svg' },

  { name: 'Uruguay', code: '+598', flag: '/flags/uy.svg' },
  { name: 'Uzbekistan', code: '+998', flag: '/flags/uz.svg' },
  { name: 'Vanuatu', code: '+678', flag: '/flags/vu.svg' },
  { name: 'Vatican City', code: '+379', flag: '/flags/va.svg' },
  { name: 'Venezuela', code: '+58', flag: '/flags/ve.svg' },
  { name: 'Vietnam', code: '+84', flag: '/flags/vn.svg' },
  { name: 'Yemen', code: '+967', flag: '/flags/ye.svg' },
  { name: 'Zambia', code: '+260', flag: '/flags/zm.svg' },
  { name: 'Zimbabwe', code: '+263', flag: '/flags/zw.svg' },
]

const SOCIAL_MEDIA = [
  { name: 'WhatsApp', icon: '/icons/whatsapp.png', url: 'https://api.whatsapp.com/send?text=' },
  { name: 'Instagram', icon: '/icons/instagram.png', handler: 'instagram' },
  { name: 'Facebook', icon: '/icons/fb.png', url: 'https://www.facebook.com/sharer/sharer.php?u=' },
  { name: 'Snapchat', icon: '/icons/snapchat.png', url: 'https://www.snapchat.com/share?url=' },
]

export function PhoneVerification() {
  const [isOpen, setIsOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0])
  const [phone, setPhone] = useState('')
  const [search, setSearch] = useState('')
  const { isVerified, setIsVerified } = useVerification()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    if (localStorage) {
      const isVerified = localStorage.getItem('isVerified')
      if (isVerified) {
        setIsVerified(true)
      }
    }
  }, [setIsVerified])

  const handleShare = () => {
    setIsShareDialogOpen(true)
  }

  const handlePhoneSubmit = async () => {
    if (!phone.trim()) {
      toast({
        title: "Error",
        description: "Please enter a phone number",
        variant: "destructive"
      });
      return;
    }

    // Basic phone number validation
    const phoneRegex = /^\d{8,15}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if phone number already exists
      const formattedPhone = `${selectedCountry.code}${phone.trim()}`;
      const phoneQuery = query(
        collection(db, 'waitlist'),
        where('phoneNumber', '==', formattedPhone)
      );
      const existingDocs = await getDocs(phoneQuery);

      if (!existingDocs.empty) {
        toast({
          title: "Already registered",
          description: "This phone number is already on the waiting list",
          variant: "destructive"
        });
        return;
      }

      // Add to waitlist collection
      await addDoc(collection(db, 'waitlist'), {
        phoneNumber: formattedPhone,
        countryCode: selectedCountry.code,
        countryName: selectedCountry.name,
        timestamp: new Date().toISOString(),
        rawPhone: phone.trim()
      });

      // Clear phone input and show success message
      setPhone('');
      toast({
        title: "Success!",
        description: "You've been added to the waiting list",
      });

      // Optional: Open share dialog after successful registration
      handleShare();

    } catch (error) {
      console.error('Error adding phone number:', error);
      toast({
        title: "Error",
        description: "Failed to join waiting list. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialMediaShare = async (platform: string, urlOrHandler: string) => {
    try {
      if (platform === 'Instagram') {
        await handleInstagramShare();
      } else {
        await addDoc(collection(db, 'shares'), {
          platform,
          timestamp: new Date(),
        });
        if (!isVerified) {
          localStorage.setItem('isVerified', 'true');
          setIsVerified(true);
        }
        window.open(urlOrHandler + encodeURIComponent(window.location.href), '_blank');
      }
    } catch (error) {
      console.error('Error adding share:', error);
    }
  };

  const handleInstagramShare = async () => {
    try {
      const shareText = "Check out this anonymous messaging app! " + window.location.href;
      await navigator.clipboard.writeText(shareText);
      await addDoc(collection(db, 'shares'), {
        platform: 'Instagram',
        timestamp: new Date(),
      });
      if (!isVerified) {
        localStorage.setItem('isVerified', 'true');
        setIsVerified(true);
      }
      window.open('https://www.instagram.com/', '_blank');
    } catch (error) {
      console.error('Error handling Instagram share:', error);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      await addDoc(collection(db, 'shares'), {
        platform: 'Copy Link',
        timestamp: new Date(),
      })
      if (!isVerified) {
        localStorage.setItem('isVerified', 'true')
        setIsVerified(true)
      }
      // You might want to show a toast or some feedback here
    } catch (error) {
      console.error('Error copying link:', error)
    }
  }

  return (
    <>
      <div className='flex flex-col items-center justify-center gap-4 !mt-20'>
        <Card className="p-4 text-center max-w-md">
          <h3 className="text-lg font-semibold mb-4">
            Revela los Secretos de la Ibero <br />
            Join waiting list....
          </h3>
          <div className="flex gap-2 mb-4 rounded-3xl shadow-lg p-1 border border-gray-100">
            <Button
              variant="outline"
              className="w-[100px] outline-none border-none shadow-none bg-transparent"
              onClick={() => setIsOpen(true)}
            >
              <Image
                src={selectedCountry.flag}
                alt={`${selectedCountry.name} flag`}
                width={24}
                height={18}
                className=""
              />
              {selectedCountry.code}
            </Button>
            <Input
              type="tel"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className='outline-none shadow-none text-sm border-l-[1px] border-r-0 border-y-0 rounded-none border-gray-300'
            />
          </div>
          <Button
            onClick={handlePhoneSubmit}
            disabled={isSubmitting}
            className="w-full bg-white text-[#4AB84A] font-bold rounded-3xl py-0 h-8"
          >
            {isSubmitting ? 'Joining...' : 'Join Waitlist'}
          </Button>
        </Card>
        <Button
          className="w-full bg-white text-[#4AB84A] font-bold rounded-3xl py-0 h-8 max-w-md"
          onClick={handleShare}
        >
          Share
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Country</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="max-h-[300px] overflow-auto">
            {filteredCountries.map((country) => (
              <Button
                key={country.code + country.name + country.flag}
                variant="ghost"
                className="w-full justify-between"
                onClick={() => {
                  setSelectedCountry(country)
                  setIsOpen(false)
                }}
              >
                <span className="flex items-center">
                  <Image
                    src={country.flag}
                    alt={`${country.name} flag`}
                    width={24}
                    height={18}
                    className="mr-2"
                  />
                  {country.name}
                </span>
                <span>{country.code}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share on Social Media</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center space-x-4">
            {SOCIAL_MEDIA.map((platform) => (
              <Button
                key={platform.name}
                variant="outline"
                className="p-2"
                onClick={() => handleSocialMediaShare(platform.name, platform.url || platform.handler || '')}
              >
                <Image src={platform.icon} alt={platform.name} width={24} height={24} />
                <span className="sr-only">{platform.name}</span>
              </Button>
            ))}
            <Button
              variant="outline"
              className="p-2"
              onClick={handleCopyLink}
            >
              <Copy className="h-6 w-6" />
              <span className="sr-only">Copy Link</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

