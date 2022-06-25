module.exports.getDuration = (start,end) => {
       // YYYY/MM/DD

    // year
    const startYear = Number(start.slice(0,4));
    const endYear = Number(end.slice(0,4));
    const yearDuration = (endYear - startYear) !== 0 ? (endYear - startYear) * 12 : 0;
    
    // month
    if(start[5] == 0){start = start[6]}else{start = start[5]+start[6]}
    if(end[5] == 0){end = end[6]}else{end = end[5] + end[6]};


    const startMonth = Number(start);
    const endMonth = Number(end);


    // Kalkulasi => selisih bulan + selisih tahun = durasi selisih total
    const duration = endMonth - startMonth + yearDuration;
    
    if(duration === 0) return 'Dibawah sebulan'
    return duration + ' '  + 'bulan' 
};


module.exports.getDateStringFormat = (date) => {
    // Format : YYYY/MM/DD

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    return `${date[8] == 0 ? date[9] : date[8]+date[9]} ${date[5] == 0 ? months[date[6] - 1] : months[date.slice(5,7) - 1] } ${date.slice(0,4)}` 
}
