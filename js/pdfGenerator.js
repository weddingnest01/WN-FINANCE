window.generatePremiumPDF = function(quote) {
  const container = document.createElement('div');
  container.style.width = '794px';
  container.style.fontFamily = "'Outfit', sans-serif";
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  
  // Define colors
  const darkTeal = '#02303A';
  const lightCream = '#EBE6DA';
  const goldText = '#cbb89d';

  // Format Dates
  let eventDate = '';
  if (quote.endDate) {
    eventDate = new Date(quote.startDate || quote.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase() + ' - ' + new Date(quote.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
  } else {
    eventDate = new Date(quote.startDate || quote.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
  }
  const quoteDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();

  // Quantities logic
  const qty = quote.servicesQuantities || {};
  let teamHtml = '';
  const teamMap = [
    { key: 'tradPhoto', label: 'TRADITIONAL PHOTOGRAPHER' },
    { key: 'tradVideo', label: 'TRADITIONAL CINEMATOGRAPHER' },
    { key: 'candPhoto', label: 'CANDID PHOTOGRAPHER' },
    { key: 'cinema', label: 'CINEMATOGRAPHER' },
    { key: 'drone', label: 'DRONE OPERATOR' },
    { key: 'famPhoto', label: 'FAMILY PHOTOGRAPHER' },
    { key: 'ledScreen', label: 'LED SCREEN' },
    { key: 'plasmaTv', label: 'PLASMA TV' }
  ];
  let totalPhoto = 0;
  let totalVideo = 0;
  // This global teamHtml is still used for backward compatibility if needed, but Page 4 will mostly use its own loop

  // Generate dynamic days logic
  let daysData = quote.days || [];
  if (!daysData || daysData.length === 0) {
    if (quote.servicesQuantities) {
      daysData = [{
        title: 'WEDDING EVENT COVERAGE',
        tradPhoto: quote.servicesQuantities.tradPhoto || 0,
        tradVideo: quote.servicesQuantities.tradVideo || 0,
        candPhoto: quote.servicesQuantities.candPhoto || 0,
        cinema: quote.servicesQuantities.cinema || 0,
        drone: quote.servicesQuantities.drone || 0,
        famPhoto: quote.servicesQuantities.famPhoto || 0,
        ledScreen: quote.servicesQuantities.ledScreen || 0,
        plasmaTv: quote.servicesQuantities.plasmaTv || 0
      }];
    }
  }

  let dayWiseHtml = '';
  daysData.forEach((day, index) => {
    let dayTeamHtml = '';
    let dayTotalPhoto = 0;
    let dayTotalVideo = 0;
    
    let leftColHtml = '';
    let rightColHtml = '';
    let itemCount = 0;

    teamMap.forEach(item => {
      if (day[item.key] && day[item.key] > 0) {
        const itemStr = `<div style="font-size: 14px; color: ${darkTeal}; margin-bottom: 6px; font-weight: 700; font-family: 'Glacial Indifference', sans-serif;">• ${day[item.key]} ${item.label}</div>`;
        if (itemCount < 4) leftColHtml += itemStr;
        else rightColHtml += itemStr;
        itemCount++;
        
        if (item.key.toLowerCase().includes('photo')) dayTotalPhoto += day[item.key];
        if (item.key.toLowerCase().includes('video') || item.key.toLowerCase().includes('cinema')) dayTotalVideo += day[item.key];
      }
    });

    if (itemCount === 0) {
      leftColHtml = `<div style="font-size: 14px; color: ${darkTeal}; font-weight: 700; font-family: 'Glacial Indifference', sans-serif;">• AS PER CUSTOM REQUIREMENT</div>`;
    }

    dayTeamHtml = `
      <div style="display: flex; gap: 40px; margin-top: 16px;">
        <div style="flex: 1;">${leftColHtml}</div>
        <div style="flex: 1;">${rightColHtml}</div>
      </div>
    `;

    dayWiseHtml += `
      <div style="display: flex; margin-bottom: 40px; border-radius: 24px; overflow: hidden; background-color: ${lightCream}; box-shadow: 0 4px 20px rgba(0,0,0,0.1); height: 230px;">
        <div style="background-color: #2b393d; width: 70px; display: flex; align-items: center; justify-content: center; position: relative;">
          <div style="transform: rotate(-90deg); font-family: 'New Eviore', 'Cormorant Garamond', serif; font-size: 26px; color: #fff; letter-spacing: 4px; white-space: nowrap;">${(day.badge || `DAY ${index + 1}`).toUpperCase()}</div>
        </div>
        <div style="flex: 1; padding: 30px;">
          <div style="margin-bottom: 12px;">
            <div style="font-family: 'New Eviore', 'Cormorant Garamond', serif; font-size: 28px; color: ${darkTeal}; text-transform: uppercase; margin-bottom: 6px;">${day.title || 'EVENT COVERAGE'}</div>
            <div style="width: 100%; height: 1px; background-color: #607373; position: relative;">
              <div style="position: absolute; right: 0; top: -3px; width: 6px; height: 6px; border-radius: 50%; border: 1.5px solid #607373; background-color: ${lightCream}; box-sizing: border-box;"></div>
            </div>
          </div>
          <div style="display: flex; gap: 12px; margin-bottom: 12px;">
            ${dayTotalPhoto > 0 ? `<div style="background-color: #66767a; color: #fff; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase;">${dayTotalPhoto} PHOTOGRAPHER</div>` : ''}
            ${dayTotalVideo > 0 ? `<div style="background-color: #66767a; color: #fff; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase;">${dayTotalVideo} VIDEOGRAPHER</div>` : ''}
          </div>
          <div>
            ${dayTeamHtml}
          </div>
        </div>
      </div>
    `;
  });

  // Custom Items logic
  let customItemsHtml = '';
  if (quote.items && quote.items.length > 0) {
    quote.items.forEach(item => {
      customItemsHtml += `<div style="font-size: 16px; margin-bottom: 12px; display: flex; align-items: center;"><span style="width: 8px; height: 8px; background: ${lightCream}; border-radius: 50%; margin-right: 12px;"></span>${item.description} - Rs. ${item.amount.toLocaleString('en-IN')}</div>`;
    });
  }

  // Deliverables logic
  const defaultDeliverables = [
    { label: 'SAME DAY COUPLE PHOTO EDITED FOR SOCIAL MEDIA', hasCount: false, checked: true },
    { label: 'WEDDING COUPLE PHOTO EDITED', hasCount: false, checked: true },
    { label: 'BRIDE & GROOM SOLO PICTURE EDITED', hasCount: false, checked: true },
    { label: 'COUPLE SOCIAL MEDIA POST EDITED', hasCount: false, checked: true },
    { label: 'WEDDING HIGHLIGHT', hasCount: true, count: 2, checked: true },
    { label: 'REEL( EXTRA REELS PER REELS 1500)', hasCount: true, count: 4, checked: true },
    { label: 'FULL WEDDING PART (PENDRIVE)', hasCount: false, checked: true }
  ];
  
  const selectedDeliverables = quote.deliverables || defaultDeliverables;
  let deliverablesHtml = '';
  selectedDeliverables.forEach(item => {
    if (item.checked !== false) {
      if (item.hasCount) {
        // e.g. "2 WEDDING HIGHLIGHT"
        deliverablesHtml += `<li>${item.count} ${item.label}</li>`;
      } else {
        deliverablesHtml += `<li>${item.label}</li>`;
      }
    }
  });

  const pageStyle = `width: 794px; height: 1120px; position: relative; overflow: hidden; box-sizing: border-box;`;

  // Page 1: Title
  const page1 = `
    <div style="${pageStyle} background-color: ${darkTeal}; display: flex; flex-direction: column; align-items: center;">
      <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 50px; width: 100%;">
        <div style="font-family: 'Grown', 'Cormorant Garamond', serif; color: #fff; font-size: 28px; letter-spacing: 2px; margin-bottom: 10px;">WEDDING</div>
        <div style="font-family: 'Grown', 'Cormorant Garamond', serif; color: #fff; font-size: 32px; letter-spacing: 2px; margin-bottom: 20px;">PHOTOGRAPHY & FILM</div>
        
        <div style="text-align: center; margin-top: auto; margin-bottom: auto;">
          <img src="https://pnqswycgzldfhjnrqqyz.supabase.co/storage/v1/object/public/assets/01.png" style="width: 380px; max-height: 350px; object-fit: contain;" alt="Wedding Nest Logo" />
        </div>
      </div>

      <div style="font-family: 'Cormorant Garamond', serif; color: #fff; font-size: 24px; font-weight: bold; margin-bottom: 24px;">
        Capturing Every Chapter of Your Love Story
      </div>

      <div style="background-color: ${lightCream}; width: 100%; padding: 30px 60px; box-sizing: border-box;">
        <div style="text-align: center; font-family: 'New Eviore', 'Cormorant Garamond', serif; font-size: 42px; color: ${darkTeal}; margin-bottom: 16px;">
          Proposal
        </div>
        <div style="height: 1px; background-color: ${darkTeal}; width: 100%; margin-bottom: 30px;"></div>

        <div style="background: #fff; border-radius: 20px; padding: 24px 30px; display: flex; flex-wrap: wrap; gap: 24px;">
          <div style="width: calc(50% - 12px);">
            <div style="font-size: 12px; font-weight: 600; color: #333; margin-bottom: 6px;">PREPARED FOR</div>
            <div style="font-size: 16px; font-weight: 700; color: #000; text-transform: uppercase;">${quote.clientName}</div>
          </div>
          <div style="width: calc(50% - 12px); text-align: right;">
            <div style="font-size: 12px; font-weight: 600; color: #333; margin-bottom: 6px;">EVENT DATE</div>
            <div style="font-size: 14px; color: #000;">${eventDate}</div>
          </div>
          <div style="width: calc(50% - 12px);">
            <div style="font-size: 12px; font-weight: 600; color: #333; margin-bottom: 6px;">VENUE</div>
            <div style="font-size: 14px; color: #000; text-transform: uppercase;">${quote.venue || 'TBD'}</div>
          </div>
          <div style="width: calc(50% - 12px); text-align: right;">
            <div style="font-size: 12px; font-weight: 600; color: #333; margin-bottom: 6px;">QUOTE DATE</div>
            <div style="font-size: 14px; color: #000;">${quoteDate}</div>
          </div>
          <div style="width: 100%; text-align: center; margin-top: 10px;">
            <div style="font-size: 11px; font-weight: 600; color: #333; margin-bottom: 4px;">VALID UNTIL</div>
            <div style="font-size: 13px; color: #000;">30 Days from Issue</div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <div style="font-family: 'New Eviore', 'Cormorant Garamond', serif; font-size: 24px; color: ${darkTeal}; margin-bottom: 8px;">OUR PROMISE TO YOU</div>
          <div style="font-family: 'Glacial Indifference', sans-serif; font-size: 14px; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto;">
            At Wedding Nest, we believe your wedding is not just an event — it is the beginning of your forever. We blend artistic vision with heartfelt storytelling to deliver images and films that you will treasure for generations.<br>Every glance, every tear, every laugh — beautifully preserved.
          </div>
        </div>
      </div>
    </div>
  `;

  const timelineStep = (number, title, desc, time, isLeft, top) => {
    // Container is 794px. Circle is at 397px, width 60px (367px to 427px).
    const boxAlign = isLeft ? 'left: 30px;' : 'right: 30px;';
    
    // For isLeft=true: box left=30, width=310 -> right=340. 
    // Cap is 6px wide. We place it at 339 to 345 (1px overlap with box). Connector goes 345 to 367 (width 22px).
    // For isLeft=false: box right=30, width=310 -> left=454. 
    // Connector from 427 to 449 (width 22px). Cap at right:-6px -> 449 to 455 (1px overlap with box).
    const connectorHtml = isLeft 
      ? `<div style="position: absolute; left: 345px; top: 32px; width: 22px; height: 6px; background-color: ${lightCream};">
           <div style="position: absolute; left: -6px; top: -12px; width: 6px; height: 30px; background-color: ${lightCream}; border-radius: 6px;"></div>
         </div>`
      : `<div style="position: absolute; left: 427px; top: 32px; width: 22px; height: 6px; background-color: ${lightCream};">
           <div style="position: absolute; right: -6px; top: -12px; width: 6px; height: 30px; background-color: ${lightCream}; border-radius: 6px;"></div>
         </div>`;

    const boxHtml = `
      <div style="position: absolute; top: 35px; ${boxAlign} width: 310px; background-color: rgba(255,255,255,0.06); border-radius: 12px; padding: 16px 24px; box-sizing: border-box; transform: translateY(-50%); border: 1px solid rgba(255,255,255,0.15);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 8px;">
          <div style="font-family: 'New Eviore', 'Cormorant Garamond', serif; font-size: 21px; color: #fff; font-weight: normal; letter-spacing: 0.5px; line-height: 1.2;">${title}</div>
          <div style="font-family: 'New Eviore', 'Cormorant Garamond', serif; font-size: 13px; color: #fff; font-weight: normal; opacity: 0.9; white-space: nowrap;">${time}</div>
        </div>
        <div style="font-family: 'Outfit', sans-serif; font-size: 13px; color: #fff; font-weight: 400; opacity: 0.85; line-height: 1.6; letter-spacing: 0.3px;">${desc}</div>
      </div>
    `;

    return `
      <div style="position: absolute; top: ${top}px; left: 0; width: 100%; height: 100px;">
        <div style="position: absolute; left: 50%; top: 5px; width: 60px; height: 60px; background-color: ${lightCream}; border-radius: 50%; transform: translateX(-50%); display: flex; align-items: center; justify-content: center; font-family: 'New Eviore', 'Cormorant Garamond', serif; font-size: 28px; color: ${darkTeal}; font-weight: bold; z-index: 2;">
          ${number}
        </div>
        ${connectorHtml}
        ${boxHtml}
      </div>
    `;
  };

  // Page 2: Our Process
  const page2 = `
    <div class="html2pdf__page-break"></div>
    <div style="${pageStyle} background-color: ${darkTeal}; padding: 60px 0;">
      <div style="text-align: center; font-family: 'New Eviore', 'Cormorant Garamond', serif; font-size: 36px; color: #fff; margin-bottom: 12px;">OUR PROCESS</div>
      <div style="text-align: center; font-family: 'Open Sauce One', sans-serif; font-size: 16px; color: #fff; margin-bottom: 50px;">From your first enquiry to receiving your final gallery, here is how we take care of you.</div>
      
      <div style="position: relative; width: 794px; margin: 0 auto; height: 900px;">
        <div style="position: absolute; left: 50%; top: 0; height: 860px; width: 6px; background-color: ${lightCream}; transform: translateX(-50%);"></div>
        
        ${timelineStep('1', 'Enquiry & Discovery', 'Reach out via WhatsApp, Instagram, or our website. We respond within 24 hours.', 'Day 1', true, 0)}
        ${timelineStep('2', 'Consultation Call', 'We hop on a relaxed call to understand your vision, families and wedding style.', 'Week 1', false, 115)}
        ${timelineStep('3', 'Booking Confirmed', '30% retainer locks your date. You are officially our couple.', 'Week 1-2', true, 230)}
        ${timelineStep('4', 'Pre Planning', 'Pre-Wedding shoot + 2 planning calls before the big day.', '1-3 Months', false, 345)}
        ${timelineStep('5', 'Your Wedding Day', 'We arrive early and capture every emotion, big and small.', 'The Big Day', true, 460)}
        ${timelineStep('6', '48-Hour Sneak Peek', '30-40 handpicked photos + a reel ready to share.', '2 Days After', false, 575)}
        ${timelineStep('7', 'Full Gallery & Film', 'All photos in 3-4 weeks. Full Cinematic Wedding in 6-8 weeks.', '6 - 10 Weeks', true, 690)}
        ${timelineStep('8', 'Happily Ever After', 'USB, album & files delivered. Clients become lifelong friends.', 'Always', false, 805)}

      </div>
    </div>
  `;

  // Page 3: Why Choose Us
  const page3 = `
    <div class="html2pdf__page-break"></div>
    <div style="${pageStyle} background-color: ${lightCream}; padding: 60px; display: flex; flex-direction: column;">
      <div style="letter-spacing: 4px; font-size: 14px; font-weight: 600; color: ${darkTeal}; margin-bottom: 20px; text-transform: uppercase;">WHY CHOOSE US</div>
      <div style="font-family: 'Cormorant Garamond', serif; font-size: 48px; color: ${darkTeal}; font-weight: 700; line-height: 1.1; margin-bottom: 20px; max-width: 500px;">
        Your Wedding Happens Once.
      </div>
      <div style="font-size: 16px; color: #333; margin-bottom: 40px; line-height: 1.6;">
        There is no second take. No rehearsal for the look your father gives you at the mandap, or the moment your partner's eyes fill with tears. We exist to make sure those moments are preserved — exactly as they were — forever.
      </div>

      <div style="display: flex; flex-direction: column; gap: 30px; margin-bottom: 40px;">
        <div style="display: flex; align-items: center; gap: 20px;">
          <div style="font-family: 'New Eviore', 'Cormorant Garamond', serif; font-size: 60px; color: ${darkTeal}; line-height: 1;">1</div>
          <div style="width: 3px; background-color: ${darkTeal}; height: 60px;"></div>
          <div>
            <div style="font-family: 'New Eviore', 'Cormorant Garamond', serif; font-size: 24px; color: ${darkTeal}; margin-bottom: 8px; font-weight: 600;">You Deserve to Feel — Not Manage.</div>
            <div style="font-size: 14px; color: #444; line-height: 1.5;">Most couples spend their wedding day anxious about coverage. With Wedding Nest, you feel nothing but joy. We have shot 200+ weddings. We know exactly where to stand before you even know the moment is coming. You stay present. We stay alert. Everything gets captured.</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 20px;">
          <div style="font-family: 'New Eviore', 'Cormorant Garamond', serif; font-size: 60px; color: ${darkTeal}; line-height: 1;">2</div>
          <div style="width: 3px; background-color: ${darkTeal}; height: 60px;"></div>
          <div>
            <div style="font-family: 'New Eviore', 'Cormorant Garamond', serif; font-size: 24px; color: ${darkTeal}; margin-bottom: 8px; font-weight: 600;">Your Story is Not Generic. Your Photos Should Not Be Either.</div>
            <div style="font-size: 14px; color: #444; line-height: 1.5;">We do not use cookie-cutter poses or assembly-line edits. Before your wedding we invest time understanding your family, your personalities, your emotions — so the images we create could only ever belong to you. Every frame is intentional.</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 20px;">
          <div style="font-family: 'New Eviore', 'Cormorant Garamond', serif; font-size: 60px; color: ${darkTeal}; line-height: 1;">3</div>
          <div style="width: 3px; background-color: ${darkTeal}; height: 60px;"></div>
          <div>
            <div style="font-family: 'New Eviore', 'Cormorant Garamond', serif; font-size: 24px; color: ${darkTeal}; margin-bottom: 8px; font-weight: 600;">We Understand Every Ritual — Before You Explain It.</div>
            <div style="font-size: 14px; color: #444; line-height: 1.5;">Haldi, Pithi, Vidai, Saptapadi — we know each ceremony, each emotion, each fleeting micro-moment that matters. No briefing needed. We are already positioned before the moment unfolds.</div>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 16px; margin-top: auto; margin-bottom: 20px;">
        <div style="flex: 1; height: 325px; border-radius: 4px; border: 4px solid #000; overflow: hidden; position: relative; background-color: #ddd;">
          <img src="https://pnqswycgzldfhjnrqqyz.supabase.co/storage/v1/object/public/assets/12.jpg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; object-position: center;" />
        </div>
        <div style="flex: 1; height: 325px; border-radius: 4px; border: 4px solid #000; overflow: hidden; position: relative; background-color: #ccc;">
          <img src="https://pnqswycgzldfhjnrqqyz.supabase.co/storage/v1/object/public/assets/13.jpg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; object-position: center;" />
        </div>
        <div style="flex: 1; height: 325px; border-radius: 4px; border: 4px solid #000; overflow: hidden; position: relative; background-color: #bbb;">
          <img src="https://pnqswycgzldfhjnrqqyz.supabase.co/storage/v1/object/public/assets/14.jpg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; object-position: center;" />
        </div>
      </div>
    </div>
  `;

  // Page 4: Photography Plan
  const page4 = `
    <div class="html2pdf__page-break"></div>
    <div style="${pageStyle} background-color: ${darkTeal}; padding: 60px;">
      <div style="text-align: center; font-family: 'New Eviore', 'Cormorant Garamond', serif; font-size: 36px; color: #fff; margin-bottom: 80px;">Day-Wise Photography Plan</div>
      
      ${dayWiseHtml}
    </div>
  `;

  // Page 5: Deliverables
  const page5 = `
    <div class="html2pdf__page-break"></div>
    <div style="${pageStyle} background-color: ${lightCream}; padding: 40px 60px; display: flex; flex-direction: column;">
      <div style="text-align: center; font-family: 'New Eviore', 'Cormorant Garamond', serif; font-size: 36px; color: ${darkTeal}; margin-bottom: 20px;">DELIVERABLES</div>
      
      <div style="max-width: 600px; margin: 0 auto 20px auto;">
        <ul style="list-style-type: disc; color: ${darkTeal}; font-size: 14px; font-weight: 700; font-family: 'DM Sans', sans-serif; line-height: 2; padding-left: 20px;">
          ${deliverablesHtml}
        </ul>
      </div>

      <div style="margin-bottom: 20px;">
        <div style="font-family: 'New Eviore', 'Cormorant Garamond', serif; font-size: 32px; color: ${darkTeal}; text-transform: uppercase; margin-bottom: 4px;">TOTAL INVESTMENT</div>
        <div style="display: flex; align-items: baseline; gap: 20px;">
          <div style="font-family: 'Maharlika', 'Cormorant Garamond', serif; font-size: 48px; color: ${darkTeal}; font-weight: normal;">${quote.packagePrice.toLocaleString('en-IN')}/-</div>
          <div style="font-size: 14px; color: ${darkTeal}; font-weight: 600;">(Excluding taxes,travel,accommodation,food&add-on service)</div>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; margin-top: auto; margin-bottom: 20px;">
        <div style="display: flex; gap: 8px; margin-left: 90px;">
          <div style="width: 180px; height: 260px; border-radius: 4px; border: 3px solid #000; overflow: hidden; position: relative; background-color: #ddd;">
            <img src="https://pnqswycgzldfhjnrqqyz.supabase.co/storage/v1/object/public/assets/15.jpg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; object-position: center;" />
          </div>
          <div style="width: 180px; height: 260px; border-radius: 4px; border: 3px solid #000; overflow: hidden; position: relative; background-color: #ccc;">
            <img src="https://pnqswycgzldfhjnrqqyz.supabase.co/storage/v1/object/public/assets/16.jpg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; object-position: center;" />
          </div>
          <div style="width: 180px; height: 260px; border-radius: 4px; border: 3px solid #000; overflow: hidden; position: relative; background-color: #bbb;">
            <img src="https://pnqswycgzldfhjnrqqyz.supabase.co/storage/v1/object/public/assets/17.jpg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; object-position: center;" />
          </div>
        </div>
        <div style="display: flex; gap: 8px; margin-right: 90px;">
          <div style="width: 180px; height: 260px; border-radius: 4px; border: 3px solid #000; overflow: hidden; position: relative; background-color: #aaa;">
            <img src="https://pnqswycgzldfhjnrqqyz.supabase.co/storage/v1/object/public/assets/18.JPG" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; object-position: center;" />
          </div>
          <div style="width: 180px; height: 260px; border-radius: 4px; border: 3px solid #000; overflow: hidden; position: relative; background-color: #999;">
            <img src="https://pnqswycgzldfhjnrqqyz.supabase.co/storage/v1/object/public/assets/19.jpg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; object-position: center;" />
          </div>
          <div style="width: 180px; height: 260px; border-radius: 4px; border: 3px solid #000; overflow: hidden; position: relative; background-color: #888;">
            <img src="https://pnqswycgzldfhjnrqqyz.supabase.co/storage/v1/object/public/assets/20.jpg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; object-position: center;" />
          </div>
        </div>
      </div>
    </div>
  `;

  // Page 6: Customise & Terms
  const page6 = `
    <div class="html2pdf__page-break"></div>
    <div style="${pageStyle} background-color: ${darkTeal}; padding: 60px; display: flex; flex-direction: column;">
      <div style="text-align: center; font-family: 'New Eviore', 'Cormorant Garamond', serif; font-size: 32px; color: #fff; margin-bottom: 30px;">CUSTOMISE YOUR PACKAGE</div>
      <div style="color: #fff; max-width: 600px; margin: 0 auto 50px auto; width: 100%;">
        <ul style="list-style-type: disc; font-family: 'Glacial Indifference', sans-serif; font-size: 16px; color: #fff; line-height: 2.2; padding-left: 20px;">
          <li>Pre-Wedding Film Rs. 40,000</li>
          <li>Same-Day Highlight Edit Rs. 18,000</li>
          <li>Drone Aerial Session Rs. 10,000</li>
          <li>Fine Art Printed Album (30 pgs) "12 x 36" Rs. 22,000</li>
          <li>Insta Handler Rs.20,000 Per Day (3 Reels Per Day)</li>
          <li>Led-Screen 8 x12 Rs.14,000</li>
          <li>Led Live Mixing Rs.10,000</li>
        </ul>
      </div>

      <div style="text-align: center; font-family: 'New Eviore', 'Cormorant Garamond', serif; font-size: 32px; color: #fff; margin-bottom: 10px;">TERMS &amp; CONDITIONS</div>
      <div style="text-align: center; font-family: 'Montserrat', sans-serif; font-size: 24px; color: #fff; margin-bottom: 30px;">Good to Know</div>
      
      <div style="max-width: 750px; margin: 0 auto 40px auto;">
        <ul style="list-style-type: disc; font-family: 'Open Sauce', sans-serif; color: #fff; font-size: 11px; font-weight: normal; line-height: 2.2; padding-left: 20px;">
          <li>BOOKING AMOUNT IS 30% (NON-REFUNDABLE) , 40% ON EVENT DAY OR BEFORE THE EVENT, 10% ON FINALE DELIVERY.</li>
          <li>THE ORIGINAL DATA WILL BE PROVIDED ONLY AFTER 100% OF THE PAYMENT MADE</li>
          <li>FOR A COUPLE PHOTOSHOOT ONE HOUR OF TIME SLOT SHALL BE REQUIRED FROM THE COUPLE,AND HALF AN HOUR OF TIME SLOT SHALL BE REQUIRED FROM IMMEDIATE FAMILY MEMBERS ON THE RESPECTIVE</li>
          <li>EDIT STARTS AFTER 90% OF THE PAYMENT</li>
          <li>TRAVEL COST, VISA, STAY ARE EXLUDED IF THE SHOOT WILL BE OUTSIDE SURAT CITY.</li>
          <li>COPYRIGHTS: TEAM WEDDING NEST RESERVES THE RIGHT TO USAGE OF PHOTOGRAPHS AND FILM CONTENT. WE MIGHT BE USING SOME PART OF THE CONTENT TO PROMOTE OUR WORK ON SOCIAL MEDIA / WEBSITE ETC.</li>
          <li>ALBUM PROOF &amp; VIDEO CORRECTION IS ONLY ONE TIME ONLY</li>
          <li>WE DON’T SHOOT PEOPLE WHILE EATING</li>
          <li>TEAM WEDDING NEST WILL HAVE THEIR FOOD &amp; STAY WITH THE GUESTS ONLY.</li>
          <li>THE BUDGET WILL BE VALID TILL 1 MONTH FROM IT’S SENT DATE</li>
        </ul>
      </div>

      <div style="margin-top: auto; background-color: ${lightCream}; border-radius: 16px; padding: 25px; text-align: center;">
        <div style="font-family: 'DM Serif Display', serif; font-size: 28px; color: ${darkTeal}; font-weight: normal; margin-bottom: 12px;">READY TO BEGIN YOUR STORY?</div>
        <div style="font-family: 'New Eviore', serif; font-size: 16px; color: ${darkTeal}; margin-bottom: 20px;">We take on a limited number of weddings each year so every couple gets our complete love and attention.</div>
        <div style="font-family: 'Open Sauce One', sans-serif; display: flex; justify-content: center; gap: 15px; font-size: 10px; color: ${darkTeal}; font-weight: bold; align-items: center; flex-wrap: wrap;">
          <div>+91 8140298239</div>
          <div style="width: 2px; height: 16px; background-color: ${darkTeal};"></div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E1306C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            weddingnest_studio
          </div>
          <div style="width: 2px; height: 16px; background-color: ${darkTeal};"></div>
          <div style="display: flex; align-items: center; gap: 4px; text-align: left;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EA4335" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <div style="max-width: 250px;">218, ANGLE BUSINESS CENTER, NEAR ABC CIRCLE, MOTA VARACHHA, SURAT</div>
          </div>
          <div style="width: 100%; margin-top: 5px;">WEDDINGNEST01@GMAIL.COM</div>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = page1 + page2 + page3 + page4 + page5 + page6;
  document.body.appendChild(container);

  const opt = {
    margin:       0,
    filename:     `Proposal_${quote.clientName.replace(/\s+/g, '_')}.pdf`,
    image:        { type: 'jpeg', quality: 1.0 },
    pagebreak:    { mode: 'css', before: '.html2pdf__page-break' },
    html2canvas:  { scale: 3, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  const images = Array.from(container.querySelectorAll('img'));
  const promises = images.map(img => {
    return new Promise((resolve) => {
      if (img.complete) return resolve();
      img.onload = resolve;
      img.onerror = resolve;
    });
  });

  Promise.all(promises).then(() => {
    html2pdf().set(opt).from(container).outputPdf('blob').then((pdfBlob) => {
      document.body.removeChild(container);
      const blobUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Proposal_${quote.clientName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    });
  });
};
